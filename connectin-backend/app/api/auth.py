"""
Этот модуль отвечает за:
1. Регистрацию пользователей (эндпоинт /register).
2. Авторизацию и получение JWT (эндпоинт /login).
3. Получение данных текущего пользователя (эндпоинты, зависящие от токена).
4. Вход через Google и GitHub OAuth.

Изменения и улучшения:
- Устранены дублирующие импорты.
- Добавлены подробные комментарии для каждой функции.
- Улучшена обработка ошибок для Google OAuth.
- Оптимизирован возврат RedirectResponse с использованием корректного URL.
- Используется единая настройка (из settings) для JWT и OAuth.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

# Импорт схем и моделей
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.utils.auth import hash_password, verify_password, generate_google_login_url, handle_google_callback, generate_github_login_url, get_github_user_info
from app.database.connection import get_db
from app.core.config import settings
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Настройка для JWT
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 минут

# Инициализация локального лимитера для ограничения скорости запросов
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=UserOut, summary="Создать аккаунт")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрирует нового пользователя.
    Проверяет, нет ли уже такого email или username, хэширует пароль.
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

# --------------------------- Ограничение скорости для логина ---------------------------
@router.post("/login", summary="Войти в систему")
@limiter.limit("5 per minute")  # Ограничение: максимум 5 запросов в минуту с одного IP
def login_user(
    request: Request,  # Добавлен параметр request для работы slowapi
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Аутентифицирует пользователя и генерирует JWT-токен.
    Декоратор лимитирования предотвращает перебор запросов.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль."
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "exp": datetime.utcnow() + access_token_expires
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"JWT-токен сгенерирован для пользователя: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.from_orm(user)
    }

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Извлекает текущего пользователя из JWT-токена.
    Если токен недействителен или пользователь не найден, выбрасывается исключение.
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
    Возвращает данные текущего пользователя, извлеченные из токена.
    """
    return current_user

# --------------------------- Google OAuth ---------------------------

@router.get("/google/login", summary="Google Login")
async def google_login(request: Request):
    """
    Генерирует URL для авторизации через Google OAuth и перенаправляет пользователя.
    """
    login_url = await generate_google_login_url(request)
    if not login_url:
        raise HTTPException(
            status_code=500,
            detail="Не удалось сформировать Google OAuth URL"
        )
    logger.info(f"Перенаправление на Google Login: {login_url}")
    return RedirectResponse(url=login_url)

@router.get("/google/callback", summary="Google Callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Обрабатывает обратный вызов от Google OAuth:
    - Получает данные пользователя.
    - Если пользователь не существует, создает нового.
    - Генерирует JWT-токен и возвращает его.
    """
    user_info = await handle_google_callback(request)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось получить данные пользователя через Google."
        )
    username = user_info.get("name", "").replace(" ", "_") or user_info["email"].split("@")[0]
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if not user:
        user = User(
            email=user_info["email"],
            username=username,
            hashed_password=None,  # Для OAuth пользователей пароль отсутствует
            google_id=user_info.get("sub"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Создан новый Google пользователь: {user.email}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "exp": datetime.utcnow() + access_token_expires,
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"JWT-токен сгенерирован для Google пользователя: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info,
    }

# --------------------------- GitHub OAuth (Пример) ---------------------------

@router.get("/github/login", summary="GitHub Login")
async def github_login(request: Request):
    """
    Генерирует URL для авторизации через GitHub OAuth и перенаправляет пользователя.
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
    Обрабатывает обратный вызов от GitHub OAuth, регистрирует или обновляет пользователя,
    и генерирует JWT-токен.
    """
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        logger.error(f"GitHub OAuth Error: {e}")
        raise HTTPException(status_code=401, detail="GitHub OAuth Error")
    user_data = await get_github_user_info(token)
    if not user_data or not user_data.get("email"):
        raise HTTPException(status_code=400, detail="Не удалось получить email из GitHub")
    username = user_data.get("login") or user_data["email"].split("@")[0]
    user = db.query(User).filter(
        (User.email == user_data["email"]) |
        (User.github == user_data["html_url"])
    ).first()
    if not user:
        user = User(
            email=user_data["email"],
            username=username,
            hashed_password=None,
            github=user_data.get("html_url", ""),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Создан новый GitHub пользователь: {user.email}")
    else:
        if user.github != user_data["html_url"]:
            user.github = user_data["html_url"]
            db.commit()
            logger.info(f"Обновлен GitHub URL для пользователя: {user.email}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "exp": datetime.utcnow() + access_token_expires
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"JWT-токен сгенерирован для GitHub пользователя: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.from_orm(user)
    }
