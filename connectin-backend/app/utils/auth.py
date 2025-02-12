"""
auth.py:
Утилиты для хэширования паролей (hash_password) и проверки (verify_password).
А также функции для аутентификации через Google OAuth.
"""
import logging
from passlib.context import CryptContext
from authlib.integrations.starlette_client import OAuth
from fastapi import Request
from app.core.config import settings

# Настройка логирования (для отладки)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Настраиваем bcrypt для хэширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Конфигурация Google OAuth
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

async def generate_google_login_url(request: Request) -> str:
    """
    Генерирует URL для входа через Google OAuth.
    """
    try:
        login_url = await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI)
        return login_url
    except Exception as e:
        logger.error(f"Ошибка при генерации Google Login URL: {e}")
        return None


async def handle_google_callback(request: Request) -> dict:
    """
    Обрабатывает ответ Google OAuth и возвращает информацию о пользователе.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo", {})
        if not user_info:
            raise ValueError("Не удалось получить информацию о пользователе.")

        return {
            "email": user_info.get("email"),
            "name": user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
        }
    except Exception as e:
        logger.error(f"Ошибка при обработке Google OAuth Callback: {e}")
        return None


def hash_password(password: str) -> str:
    """
    Возвращает хэш пароля, используя bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет соответствие хэша пароля и оригинального пароля.
    """
    return pwd_context.verify(plain_password, hashed_password)
