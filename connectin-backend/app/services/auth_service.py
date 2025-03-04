"""
Сервис для аутентификации: регистрация, вход, OAuth.
"""

from datetime import datetime, timedelta
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserOut
from app.utils.auth import hash_password, verify_password, handle_google_callback, get_github_user_info, oauth
from app.core.settings.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

class AuthService:
    @staticmethod
    def register_user(user_data: UserCreate, db: Session) -> UserOut:
        """Регистрирует нового пользователя."""
        repo = UserRepository(db)
        if repo.get_user_by_email(user_data.email) or repo.get_user_by_username(user_data.username):
            raise HTTPException(status_code=400, detail="Email или имя пользователя уже заняты")
        hashed_password = hash_password(user_data.password)
        new_user = repo.create_user(user_data.username, user_data.email, hashed_password)
        logger.info(f"Пользователь зарегистрирован: {new_user.email}")
        return UserOut.model_validate(new_user)

    @staticmethod
    def login_user(username: str, password: str, db: Session) -> dict:
        """Аутентифицирует пользователя и выдаёт JWT-токен."""
        repo = UserRepository(db)
        user = repo.get_user_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Неверное имя или пароль")
        access_token = AuthService._create_jwt_token(user.email)
        logger.info(f"Пользователь вошёл: {user.email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user)
        }

    @staticmethod
    async def google_login(request: Request, db: Session) -> dict:
        """Обрабатывает вход через Google OAuth."""
        user_info = await handle_google_callback(request)
        if not user_info:
            raise HTTPException(status_code=401, detail="Ошибка Google OAuth")
        repo = UserRepository(db)
        user = repo.get_user_by_email(user_info["email"])
        if not user:
            username = user_info.get("name", "").replace(" ", "_") or user_info["email"].split("@")[0]
            user = repo.create_user(username, user_info["email"], None, google_id=user_info.get("sub"))
            logger.info(f"Создан Google пользователь: {user.email}")
        access_token = AuthService._create_jwt_token(user.email)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user)
        }

    @staticmethod
    async def github_login(request: Request, db: Session) -> dict:
        """Обрабатывает вход через GitHub OAuth."""
        try:
            token = await oauth.github.authorize_access_token(request)
        except Exception:
            raise HTTPException(status_code=401, detail="Ошибка GitHub OAuth")
        user_data = await get_github_user_info(token)
        if not user_data or not user_data.get("email"):
            raise HTTPException(status_code=400, detail="Не удалось получить email от GitHub")
        repo = UserRepository(db)
        user = repo.get_user_by_email(user_data["email"])
        if not user:
            username = user_data.get("login") or user_data["email"].split("@")[0]
            user = repo.create_user(username, user_data["email"], None, github=user_data.get("html_url"))
            logger.info(f"Создан GitHub пользователь: {user.email}")
        else:
            if user.github != user_data["html_url"]:
                user.github = user_data["html_url"]
                db.commit()
                logger.info(f"Обновлён GitHub URL для: {user.email}")
        access_token = AuthService._create_jwt_token(user.email)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user)
        }

    @staticmethod
    def _create_jwt_token(email: str) -> str:
        """Создаёт JWT-токен."""
        expires = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {"sub": email, "exp": expires}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)