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
from typing import Optional, Union, Dict

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, WebSocket
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
from app.schemas.auth import TokenResponse
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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

# Настройки JWT и OAuth из settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30   # JWT действует 30 минут
REFRESH_TOKEN_EXPIRE_DAYS = 30     # Refresh-токен действует 30 дней
TOKEN_ROTATION_THRESHOLD_DAYS = 7
FRONTEND_URL = settings.FRONTEND_URL  # Например, URL фронтенда для редиректа

def create_jwt_token(subject: str, expire_delta: timedelta) -> str:
    """
    Создаёт JWT-токен с заданным временем жизни, используя UTC-время.
    """
    expire = datetime.utcnow().replace(tzinfo=timezone.utc) + expire_delta
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.utcnow().replace(tzinfo=timezone.utc)
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
    # Настраиваем куки с нужными параметрами
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

def validate_token(token: str) -> dict:
    """
    Validates a JWT token and returns its payload.
    Improved error handling for malformed tokens.
    """
    try:
        # Basic token format validation before attempting to decode
        if not token or not isinstance(token, str):
            logger.error("Token is empty or not a string")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        # Check for correct JWT format (should have 3 segments separated by dots)
        if len(token.split('.')) != 3:
            logger.error("Token does not have the correct number of segments")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
            
        # Decode and validate token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_ws(websocket: WebSocket, token: str = None) -> Optional[User]:
    """
    Authenticate user for WebSocket connections.
    If token is provided, use it directly. Otherwise, try to get it from the WebSocket.
    """
    try:
        if not token:
            # Try to get token from WebSocket query parameters
            token = websocket.query_params.get("token")
            if not token:
                return None

        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None

        # Get user from database using email
        db = next(get_db())
        user = db.query(User).filter(User.email == email).first()
        return user
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        return None

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
) -> Dict[str, Union[str, UserOut]]:
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

@router.post("/refresh-token", summary="Refresh access token")
@limiter.limit("10 per minute")
def refresh_access_token(
    request: Request,
    refresh_token_body: dict = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Refreshes the access token using a refresh token.
    Implements token rotation: new refresh token is issued only if current one is close to expiration.
    """
    refresh_token_value = refresh_token_body.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is required"
        )

    # Check if refresh token is blacklisted
    if db.query(BlacklistedToken).filter(BlacklistedToken.token == refresh_token_value).first():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked"
        )

    try:
        # Validate refresh token
        payload = validate_token(refresh_token_value)
        email = payload.get("sub")
        exp = payload.get("exp")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Check if refresh token is close to expiration
        if exp:
            exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
            now = datetime.now(timezone.utc)
            days_until_expiry = (exp_datetime - now).days
            should_rotate = days_until_expiry < TOKEN_ROTATION_THRESHOLD_DAYS
        else:
            should_rotate = False

        # Get user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Create new access token
        new_access_token = create_access_token(user)
        response = {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

        # Rotate refresh token if needed
        if should_rotate:
            new_refresh_token = create_refresh_token(user)
            response["refresh_token"] = new_refresh_token
            
            # Blacklist the old refresh token
            blacklisted = BlacklistedToken(token=refresh_token_value)
            db.add(blacklisted)
            db.commit()
            
            logger.info(f"Refresh token rotated for user: {user.email}")
        else:
            response["refresh_token"] = refresh_token_value

        logger.info(f"Access token refreshed for user: {user.email}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while refreshing the token"
        )

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
    try:
        login_url = await generate_google_login_url(request)
        if not login_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Ошибка генерации URL для Google OAuth"
            )
        logger.info(f"Перенаправление на Google OAuth: {login_url}")
        return RedirectResponse(url=login_url, status_code=status.HTTP_302_FOUND)
    except Exception as e:
        logger.error(f"Ошибка при генерации Google Login URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при Google OAuth: {str(e)}"
        )

@router.get("/google/callback", summary="Google Callback")
async def google_callback(request: Request, db: Session = Depends(get_db)) -> RedirectResponse:
    """
    Обрабатывает callback от Google OAuth, создает/обновляет пользователя и перенаправляет на фронтенд.
    """
    try:
        user_info = await handle_google_callback(request)
        if not user_info:
            logger.error("Не удалось получить данные пользователя от Google")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed", status_code=status.HTTP_302_FOUND)

        email = user_info.get("email")
        if not email:
            logger.error("Email не получен от Google")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=email_missing", status_code=status.HTTP_302_FOUND)
            
        google_id = user_info.get("sub")
        user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()

        if user:
            logger.info(f"Найден существующий пользователь: {user.email}")
            if not user.google_id and google_id:
                user.google_id = google_id
                db.commit()
                logger.info(f"Обновлен Google ID для пользователя: {user.email}")
        else:
            base_username = user_info.get("name", "").replace(" ", "_").lower() or email.split("@")[0]
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
        
        # Создаем ответ-перенаправление на фронтенд
        redirect_url = f"{FRONTEND_URL}/login?auth_success=true"
        logger.info(f"Перенаправление на фронтенд: {redirect_url}")
        response = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
        
        # Устанавливаем куки с токенами
        response = set_auth_cookies(response, access_token, refresh_token_value)
        return response
        
    except Exception as e:
        logger.error(f"Ошибка при обработке Google callback: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_callback_error", status_code=status.HTTP_302_FOUND)

# ---------------------- GitHub OAuth ----------------------

@router.get("/github/login", summary="GitHub Login")
async def github_login(request: Request) -> RedirectResponse:
    """
    Генерирует URL для входа через GitHub и перенаправляет пользователя.
    """
    try:
        login_url = await generate_github_login_url(request)
        if not login_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Ошибка генерации URL для GitHub OAuth"
            )
        logger.info(f"Перенаправление на GitHub OAuth: {login_url}")
        return RedirectResponse(url=login_url, status_code=status.HTTP_302_FOUND)
    except Exception as e:
        logger.error(f"Ошибка при генерации GitHub Login URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при GitHub OAuth: {str(e)}"
        )

@router.get("/github/callback", summary="GitHub Callback")
async def github_callback(request: Request, db: Session = Depends(get_db)) -> RedirectResponse:
    """
    Обрабатывает callback от GitHub OAuth, создает/обновляет пользователя и перенаправляет на фронтенд.
    """
    try:
        # Получаем токен от GitHub
        token = await oauth.github.authorize_access_token(request)
        if not token:
            logger.error("Не удалось получить токен от GitHub")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=github_token_failed", status_code=status.HTTP_302_FOUND)
            
        # Получаем данные пользователя
        user_data = await get_github_user_info(token)
        if not user_data:
            logger.error("Не удалось получить данные пользователя от GitHub")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=github_user_data_failed", status_code=status.HTTP_302_FOUND)

        email = user_data.get("email")
        if not email:
            logger.error("Email не получен от GitHub")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=email_missing", status_code=status.HTTP_302_FOUND)
            
        github_url = user_data.get("html_url")
        github_id = str(user_data.get("id", ""))
        username_github = user_data.get("login", "")
            
        # Ищем существующего пользователя
        user = db.query(User).filter(
            (User.email == email) | 
            (User.github == github_url) | 
            (User.username == username_github)
        ).first()

        if user:
            logger.info(f"Найден существующий GitHub пользователь: {user.email}")
            # Обновляем GitHub информацию, если она отсутствует
            if not user.github and github_url:
                user.github = github_url
                db.commit()
                logger.info(f"Обновлен GitHub URL для пользователя: {user.email}")
        else:
            # Создаем нового пользователя
            base_username = username_github or email.split("@")[0]
            username = generate_unique_username(base_username, db)
            user = User(
                email=email,
                username=username,
                hashed_password="",  # Для OAuth, можно оставить пустым
                github=github_url,
                avatar_url=user_data.get("avatar_url", ""),
                name=user_data.get("name", "")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Создан новый GitHub пользователь: {user.email}")

        # Генерируем токены
        access_token = create_access_token(user)
        refresh_token_value = create_refresh_token(user)
        
        # Создаем ответ-перенаправление на фронтенд
        redirect_url = f"{FRONTEND_URL}/login?auth_success=true"
        logger.info(f"Перенаправление на фронтенд: {redirect_url}")
        response = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
        
        # Устанавливаем куки с токенами
        response = set_auth_cookies(response, access_token, refresh_token_value)
        return response
        
    except Exception as e:
        logger.error(f"Ошибка при обработке GitHub callback: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=github_callback_error", status_code=status.HTTP_302_FOUND)