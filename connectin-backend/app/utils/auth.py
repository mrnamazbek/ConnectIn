"""
auth.py:
Утилиты для работы с паролями и аутентификацией через Google и GitHub OAuth.
"""

import logging
from typing import Dict, Optional
from passlib.context import CryptContext
from authlib.integrations.starlette_client import OAuth
from fastapi import Request
from app.core.config import settings
from starlette.responses import RedirectResponse

# 🔹 Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔹 Настройка bcrypt для хэширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🔹 Инициализация OAuth
oauth = OAuth()

# 🔵 Класс для настроек OAuth
class OAuthSettings:
    """Класс для хранения настроек OAuth для Google и GitHub."""
    def __init__(self):
        self.google = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "server_metadata_url": "https://accounts.google.com/.well-known/openid-configuration",
            "client_kwargs": {"scope": "openid email profile"},
        }
        self.github = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "authorize_url": "https://github.com/login/oauth/authorize",
            "access_token_url": "https://github.com/login/oauth/access_token",
            "client_kwargs": {"scope": "user:email"},
        }

oauth_settings = OAuthSettings()

# Регистрация Google OAuth
try:
    oauth.register(name="google", **oauth_settings.google)
    logger.info("✅ Google OAuth успешно настроен.")
except Exception as e:
    logger.error(f"❌ Ошибка настройки Google OAuth: {e}")

# Регистрация GitHub OAuth
try:
    oauth.register(name="github", **oauth_settings.github)
    logger.info("✅ GitHub OAuth успешно настроен.")
except Exception as e:
    logger.error(f"❌ Ошибка настройки GitHub OAuth: {e}")

# 🔹 Функции для работы с паролями
def hash_password(password: str) -> str:
    """Возвращает хэш пароля, используя bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие хэша пароля и оригинального пароля."""
    return pwd_context.verify(plain_password, hashed_password)

# 🔵 Функции для Google OAuth
async def generate_google_login_url(request: Request) -> Optional[str]:
    """Генерирует URL для входа через Google OAuth."""
    try:
        redirect = await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI)
        login_url = redirect.headers["location"]
        logger.info(f"🔹 Google Login URL: {login_url}")
        return login_url
    except Exception as e:
        logger.error(f"❌ Ошибка генерации Google Login URL: {e}")
        return None

async def handle_google_callback(request: Request) -> Optional[Dict[str, str]]:
    """Обрабатывает ответ Google OAuth и возвращает информацию о пользователе."""
    try:
        token = await oauth.google.authorize_access_token(request)
        logger.info("🔹 Google OAuth Token получен.")
        user_info = token.get("userinfo", {})
        if not user_info:
            raise ValueError("❌ Не удалось получить информацию о пользователе.")
        logger.info(f"✅ Данные пользователя: {user_info}")
        return {
            "email": user_info.get("email"),
            "name": user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
            "sub": user_info.get("sub"),
        }
    except Exception as e:
        logger.error(f"❌ Ошибка при обработке Google OAuth Callback: {e}")
        return None

# 🔵 Функции для GitHub OAuth
async def generate_github_login_url(request: Request) -> Optional[str]:
    """Генерирует URL для входа через GitHub OAuth."""
    try:
        redirect = await oauth.github.authorize_redirect(request, settings.GITHUB_REDIRECT_URI)
        login_url = redirect.headers["location"]
        logger.info(f"🔹 GitHub Login URL: {login_url}")
        return login_url
    except Exception as e:
        logger.error(f"❌ Ошибка генерации GitHub Login URL: {e}")
        return None

async def get_github_user_info(token: dict) -> Optional[Dict[str, str]]:
    """Получает данные пользователя из GitHub API."""
    try:
        resp = await oauth.github.get("https://api.github.com/user", token=token)
        user_data = resp.json()
        if not user_data.get("email"):
            resp_emails = await oauth.github.get("https://api.github.com/user/emails", token=token)
            emails = resp_emails.json()
            user_data["email"] = next((e["email"] for e in emails if e["primary"]), None)
        user_data["html_url"] = user_data.get("html_url", "")
        logger.info(f"✅ Данные пользователя GitHub: {user_data}")
        return user_data
    except Exception as e:
        logger.error(f"❌ Ошибка получения данных GitHub: {e}")
        return None

async def handle_github_callback(request: Request) -> Optional[Dict[str, str]]:
    """Обрабатывает ответ GitHub OAuth и возвращает информацию о пользователе."""
    try:
        token = await oauth.github.authorize_access_token(request)
        logger.info("🔹 GitHub OAuth Token получен.")
        user_info = await get_github_user_info(token)
        if not user_info:
            raise ValueError("❌ Не удалось получить информацию о пользователе.")
        return user_info
    except Exception as e:
        logger.error(f"❌ Ошибка при обработке GitHub OAuth Callback: {e}")
        return None