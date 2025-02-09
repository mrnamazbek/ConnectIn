"""
auth.py:
Утилиты для хэширования паролей (hash_password) и проверки (verify_password).
Можно расширить: сюда же вынести логику JWT-токенов, если нужно.
"""
from passlib.context import CryptContext
# from authlib.integrations.starlette_client import OAuth
# from fastapi import Request
# from app.core.config import settings



# oauth = OAuth()
# oauth.register(
#     name="google",
#     client_id=settings.GOOGLE_CLIENT_ID,
#     client_secret=settings.GOOGLE_CLIENT_SECRET,
#     server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
#     client_kwargs={
#         "scope": "openid email profile",
#     },
# )

# async def generate_google_login_url(request: Request) -> str:
#     """
#     Генерирует URL для входа через Google OAuth.
#     """
#     return await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI)


# async def handle_google_callback(request: Request) -> dict:
#     """
#     Обрабатывает ответ Google OAuth и возвращает информацию о пользователе.
#     """
#     token = await oauth.google.authorize_access_token(request)
#     user_info = token.get("userinfo")
#     if user_info:
#         return {
#             "email": user_info["email"],
#             "name": user_info.get("name", ""),
#             "picture": user_info.get("picture", ""),
#         }
#     return None

# Настраиваем контекст passlib для использования bcrypt (или других алгоритмов)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Возвращает хэш пароля, используя bcrypt.
    Пример использования:
        hashed_pw = hash_password("mysecret")
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Сравнивает 'сырой' пароль с хэшированным.
    Возвращает True, если они совпадают.
    """
    return pwd_context.verify(plain_password, hashed_password)
