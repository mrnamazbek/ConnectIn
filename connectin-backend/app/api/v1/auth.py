"""
Модуль auth.py отвечает за:
1. Регистрацию пользователей (эндпоинт /register).
2. Авторизацию и получение JWT (эндпоинт /login).
3. Получение данных текущего пользователя (эндпоинты, зависящие от токена).
4. Вход через Google и GitHub OAuth с автоматическим редиректом на фронтенд.
5. Обновление токенов и выход из системы.

Улучшения:
- Устранены дублирующие импорты и определения.
- Используются UTC-время для токенов.
- Добавлены подробные комментарии.
- Исправлен редирект: используется FRONTEND_URL, определённый в настройках.
- Логика работы с OAuth (Google, GitHub) оптимизирована.
- Обработка ошибок и валидация возвращаемых данных улучшена.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.schemas.user import UserOut
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.models.blacklisted_token import BlacklistedToken
from app.schemas.auth import TokenResponse  # Новая схема ответа для токенов
from app.utils.auth import (
    hash_password,
    verify_password,
    generate_google_login_url,
    handle_google_callback,
    generate_github_login_url,
    get_github_user_info,
    oauth
)
from app.utils.logger import get_logger
from app.database.connection import get_db
from app.core.config import settings

# Инициализация роутера и OAuth2 схемы
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

# Настройки JWT и OAuth из settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30   # JWT действует 30 минут
REFRESH_TOKEN_EXPIRE_DAYS = 30     # Refresh-токен действует 30 дней
FRONTEND_URL = settings.FRONTEND_URL  # Например, URL фронтенда для редиректа

def create_jwt_token(subject: str, expire_delta: timedelta) -> str:
    """
    Создаёт JWT-токен с заданным временем жизни, используя UTC-время.
    """
    expire = datetime.utcnow().replace(tzinfo=timezone.utc) + expire_delta
    payload = {
        "sub": subject,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(user: User) -> str:
    """
    Создаёт access-токен для пользователя.
    """
    return create_jwt_token(user.email, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

def create_refresh_token(user: User) -> str:
    """
    Создаёт refresh-токен для пользователя.
    """
    return create_jwt_token(user.email, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

def set_auth_cookies(response: RedirectResponse, access_token: str, refresh_token: str) -> RedirectResponse:
    """
    Устанавливает access и refresh токены в куки ответа и возвращает его.
    """
    # Используем FRONTEND_URL для редиректа
    response = RedirectResponse(url=FRONTEND_URL, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return response

def generate_unique_username(base_username: str, db: Session) -> str:
    """
    Генерирует уникальное имя пользователя, добавляя числовой суффикс, если базовое имя занято.
    """
    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}_{counter}"
        counter += 1
    return username

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Извлекает текущего пользователя из JWT-токена.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные или токен истек",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Проверка на черный список токенов
    if db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен отозван")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user

# ---------------------- Регистрация и Логин ----------------------

@router.post("/register", response_model=UserOut, summary="Создать аккаунт")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрирует нового пользователя:
    - Проверяет наличие пользователя с таким email или username.
    - Хэширует пароль и сохраняет нового пользователя.
    """
    if db.query(User).filter((User.email == user_data.email) | (User.username == user_data.username)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email или именем уже существует."
        )
    hashed_pw = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"Пользователь зарегистрирован: {new_user.email}")
    return new_user

@router.post("/login", response_model=TokenResponse, summary="Войти в систему")
@limiter.limit("5 per minute")
def login_user(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> dict[str, str | UserOut]:
    """
    Аутентифицирует пользователя по логину и паролю, возвращая JWT-токены.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль."
        )
    access_token = create_access_token(user)
    refresh_token_value = create_refresh_token(user)
    logger.info(f"JWT-токены сгенерированы для пользователя: {user.email}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_value,
        "token_type": "bearer",
        "user": UserOut.from_orm(user)
    }

@router.get("/me", response_model=UserOut, summary="Текущий пользователь")
async def read_current_user(current_user: User = Depends(get_current_user)) -> UserOut:
    """
    Возвращает данные текущего пользователя.
    """
    return UserOut.from_orm(current_user)

@router.post("/refresh_token", summary="Обновить токен")
def refresh_access_token(
    refresh_token_body: dict = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Обновляет access-токен с использованием refresh-токена.
    """
    refresh_token_value = refresh_token_body.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh токен обязателен")
    try:
        payload = jwt.decode(refresh_token_value, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный refresh токен")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный refresh токен")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    new_access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user)
    logger.info(f"Новый access токен сгенерирован для пользователя: {user.email}")
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", summary="Выход из системы")
def logout(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> dict:
    """
    Вызывает выход из системы, добавляя токен в черный список.
    """
    blacklisted = BlacklistedToken(token=token)
    db.add(blacklisted)
    db.commit()
    return {"message": "Logged out successfully"}

# ---------------------- Google OAuth ----------------------

@router.get("/google/login", summary="Google Login")
async def google_login(request: Request) -> RedirectResponse:
    """
    Генерирует URL для входа через Google и перенаправляет пользователя.
    """
    login_url = await generate_google_login_url(request)
    return RedirectResponse(url=login_url, status_code=status.HTTP_302_FOUND)

@router.get("/google/callback", summary="Google Callback")
async def google_callback(request: Request, db: Session = Depends(get_db)) -> RedirectResponse:
    """
    Обрабатывает callback от Google OAuth, создает/обновляет пользователя и перенаправляет на фронтенд.
    """
    user_info = await handle_google_callback(request)
    if not user_info:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ошибка получения данных от Google")

    email = user_info.get("email")
    google_id = user_info.get("sub")
    user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()

    if user:
        logger.info(f"Найден существующий пользователь: {user.email}")
        if not user.google_id and google_id:
            user.google_id = google_id
            db.commit()
            logger.info(f"Обновлен Google ID для пользователя: {user.email}")
    else:
        base_username = user_info.get("name", "").replace(" ", "_") or email.split("@")[0]
        username = generate_unique_username(base_username, db)
        user = User(
            email=email,
            username=username,
            hashed_password="",  # Для OAuth можно оставить пустым или задать заглушку
            google_id=google_id,
            first_name=user_info.get("given_name"),
            last_name=user_info.get("family_name"),
            avatar_url=user_info.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Создан новый Google пользователь: {user.email}")

    access_token = create_access_token(user)
    refresh_token_value = create_refresh_token(user)
    response = RedirectResponse(url=FRONTEND_URL, status_code=status.HTTP_302_FOUND)
    response = set_auth_cookies(response, access_token, refresh_token_value)
    return response

# ---------------------- GitHub OAuth ----------------------

@router.get("/github/login", summary="GitHub Login")
async def github_login(request: Request) -> RedirectResponse:
    """
    Генерирует URL для входа через GitHub и перенаправляет пользователя.
    """
    login_url = await generate_github_login_url(request)
    if not login_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка GitHub OAuth")
    return RedirectResponse(url=login_url, status_code=status.HTTP_302_FOUND)

@router.get("/github/callback", summary="GitHub Callback")
async def github_callback(request: Request, db: Session = Depends(get_db)) -> RedirectResponse:
    """
    Обрабатывает callback от GitHub OAuth, создает/обновляет пользователя и перенаправляет на фронтенд.
    """
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        logger.error(f"GitHub OAuth Error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ошибка GitHub OAuth")

    user_data = await get_github_user_info(token)
    if not user_data or not user_data.get("email"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не удалось получить email из GitHub")

    email = user_data.get("email")
    github_url = user_data.get("html_url")
    user = db.query(User).filter((User.email == email) | (User.github == github_url)).first()

    if user:
        logger.info(f"Найден существующий GitHub пользователь: {user.email}")
        if not user.github and github_url:
            user.github = github_url
            db.commit()
            logger.info(f"Обновлен GitHub URL для пользователя: {user.email}")
    else:
        base_username = user_data.get("login") or email.split("@")[0]
        username = generate_unique_username(base_username, db)
        user = User(
            email=email,
            username=username,
            hashed_password="",  # Для OAuth, можно оставить пустым
            github=github_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Создан новый GitHub пользователь: {user.email}")

    access_token = create_access_token(user)
    refresh_token_value = create_refresh_token(user)
    response = RedirectResponse(url=FRONTEND_URL, status_code=status.HTTP_302_FOUND)
    response = set_auth_cookies(response, access_token, refresh_token_value)
    return response