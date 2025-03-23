from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

# Импортируем схемы и модели
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
# Импортируем утилиты: хэширование, проверку пароля, OAuth функции и логирование
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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Настройка для JWT
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # JWT действует 30 минут
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Refresh токен действует 30 дней

# URL фронтенда
FRONTEND_URL = settings.FRONTEND_URL  # Используем настройку из конфига

# Инициализируем логгер
logger = get_logger(__name__)

# Лимитер для ограничения запросов
limiter = Limiter(key_func=get_remote_address)

# Функции для создания токенов
def create_access_token(user: User, expire_delta: timedelta):
    expire = datetime.utcnow() + expire_delta
    payload = {"sub": user.email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user: User):
    expire_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.utcnow() + expire_delta
    return jwt.encode({"sub": user.email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

# Функция для установки токенов в куки и редиректа
def set_tokens_and_redirect(access_token: str, redirect_url: str = FRONTEND_URL):
    """
    Устанавливает JWT-токены в куки и возвращает RedirectResponse на указанный URL.
    """
    response = RedirectResponse(url=redirect_url)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response

# Генерация уникального username
def generate_unique_username(base_username: str, db: Session) -> str:
    """
    Генерирует уникальный username, добавляя суффикс, если базовый username занят.
    """
    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}_{counter}"
        counter += 1
    return username

# ---------------------- Регистрация и Логин ----------------------

@router.post("/register", response_model=UserOut, summary="Создать аккаунт")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрирует нового пользователя:
    - Проверяет, существует ли уже пользователь с таким email или username.
    - Хэширует пароль перед сохранением.
    """
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email или именем пользователя уже существует."
        )

    hashed_pw = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"Пользователь зарегистрирован: {new_user.email}")
    return new_user

@router.post("/login", summary="Войти в систему")
@limiter.limit("5 per minute")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Аутентификация через логин и пароль. Возвращает JWT-токены.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль."
        )

    access_token = create_access_token(user, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    logger.info(f"JWT-токен сгенерирован для пользователя: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.from_orm(user)
    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Извлекает текущего пользователя из JWT-токена.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные или токен истёк",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user

@router.get("/me", response_model=UserOut, summary="Текущий пользователь")
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные текущего пользователя.
    """
    return current_user

@router.post("/refresh_token")
def refresh_token(refresh_token: str = Body(...), db: Session = Depends(get_db)):
    """
    Обновляет access token с использованием refresh token.
    """
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(user, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    logger.info(f"Новый access token сгенерирован для пользователя: {user.email}")
    return {"access_token": access_token, "token_time": "bearer"}

# ---------------------- Google OAuth ----------------------

@router.get("/google/login", summary="Google Login")
async def google_login(request: Request):
    """
    Генерирует URL для входа через Google и перенаправляет пользователя.
    """
    login_url = await generate_google_login_url(request)
    return RedirectResponse(url=login_url)

@router.get("/google/callback", summary="Google Callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Обрабатывает ответ от Google OAuth:
    - Получает информацию о пользователе.
    - Если пользователь не существует, создает нового с уникальным username.
    - Генерирует JWT-токен и устанавливает его в куки, перенаправляя на фронтенд.
    """
    user_info = await handle_google_callback(request)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось получить данные пользователя через Google."
        )

    email = user_info.get("email")
    google_id = user_info.get("sub")

    # Проверяем, существует ли пользователь по email или google_id
    user = db.query(User).filter(
        (User.email == email) | (User.google_id == google_id)
    ).first()

    if user:
        # Пользователь уже существует
        logger.info(f"Найден существующий пользователь: {user.email}")
        # Обновляем google_id, если его нет
        if not user.google_id and google_id:
            user.google_id = google_id
            db.commit()
            logger.info(f"Обновлен Google ID для пользователя: {user.email}")
    else:
        # Пользователь новый, создаем его
        base_username = user_info.get("name", "").replace(" ", "_") or email.split("@")[0]
        username = generate_unique_username(base_username, db)
        user = User(
            email=email,
            username=username,
            google_id=google_id,
            first_name=user_info.get("given_name"),
            last_name=user_info.get("family_name"),
            avatar_url=user_info.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Создан новый Google-пользователь: {user.email}")

    # Генерируем JWT-токен
    access_token = create_access_token(user, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    logger.info(f"JWT-токен сгенерирован для пользователя: {user.email}")

    # Устанавливаем токен в куки и перенаправляем на фронтенд
    return set_tokens_and_redirect(access_token)

# ---------------------- GitHub OAuth ----------------------

@router.get("/github/login", summary="Войти через GitHub")
async def github_login(request: Request):
    """
    Генерирует URL для входа через GitHub и перенаправляет пользователя.
    """
    login_url = await generate_github_login_url(request)
    if not login_url:
        raise HTTPException(
            status_code=500,
            detail="Ошибка настройки GitHub OAuth"
        )
    return RedirectResponse(url=login_url)

@router.get("/github/callback", summary="GitHub Callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    """
    Обрабатывает ответ от GitHub OAuth:
    - Получает информацию о пользователе.
    - Если пользователь не существует, создает нового с уникальным username.
    - Генерирует JWT-токен и устанавливает его в куки, перенаправляя на фронтенд.
    """
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        logger.error(f"GitHub OAuth Error: {e}")
        raise HTTPException(status_code=401, detail="GitHub OAuth Error")

    user_data = await get_github_user_info(token)
    if not user_data or not user_data.get("email"):
        raise HTTPException(status_code=400, detail="Не удалось получить email из GitHub")

    email = user_data.get("email")
    github_url = user_data.get("html_url")

    # Проверяем, существует ли пользователь по email или github_url
    user = db.query(User).filter(
        (User.email == email) | (User.github == github_url)
    ).first()

    if user:
        # Пользователь уже существует
        logger.info(f"Найден существующий пользователь: {user.email}")
        # Обновляем github_url, если его нет
        if not user.github and github_url:
            user.github = github_url
            db.commit()
            logger.info(f"Обновлен GitHub URL для пользователя: {user.email}")
    else:
        # Пользователь новый, создаем его
        base_username = user_data.get("login") or email.split("@")[0]
        username = generate_unique_username(base_username, db)
        user = User(
            email=email,
            username=username,
            github=github_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Создан новый GitHub-пользователь: {user.email}")

    # Генерируем JWT-токен
    access_token = create_access_token(user, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    logger.info(f"JWT-токен сгенерирован для пользователя: {user.email}")

    # Устанавливаем токен в куки и перенаправляем на фронтенд
    return set_tokens_and_redirect(access_token)