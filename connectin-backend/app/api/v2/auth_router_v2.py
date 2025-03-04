"""
Вторая версия API для аутентификации:
- Регистрация пользователей
- Вход в систему с JWT
- Получение данных текущего пользователя
- Вход через Google и GitHub OAuth
"""

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserOut
from app.api.v1.auth_router import get_current_user
from app.utils.logger import get_logger
from app.utils.auth import generate_google_login_url, generate_github_login_url

router = APIRouter()
logger = get_logger(__name__)

# Регистрация пользователя
@router.post("/register", response_model=UserOut, summary="Регистрация")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя."""
    logger.info(f"Запрос на регистрацию: {user_data.email}")
    return AuthService.register_user(user_data, db)

# Вход в систему
@router.post("/login", summary="Вход в систему")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Вход пользователя с именем и паролем."""
    logger.info(f"Запрос на вход: {form_data.username}")
    return AuthService.login_user(form_data.username, form_data.password, db)

# Получение текущего пользователя
@router.get("/me", response_model=UserOut, summary="Текущий пользователь")
def read_current_user(current_user: UserOut = Depends(get_current_user)):
    """Возвращает данные текущего пользователя."""
    logger.info(f"Запрос данных пользователя: {current_user.email}")
    return current_user

# Google OAuth: перенаправление на Google
@router.get("/google/login", summary="Вход через Google")
async def google_login(request: Request):
    """Перенаправляет на Google для входа."""
    login_url = await generate_google_login_url(request)
    logger.info(f"Перенаправление на Google: {login_url}")
    return RedirectResponse(url=login_url)

# Google OAuth: обработка обратного вызова
@router.get("/google/callback", summary="Обратный вызов Google")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Обрабатывает ответ от Google и выдаёт токен."""
    logger.info("Обработка Google callback")
    return await AuthService.google_login(request, db)

# GitHub OAuth: перенаправление на GitHub
@router.get("/github/login", summary="Вход через GitHub")
async def github_login(request: Request):
    """Перенаправляет на GitHub для входа."""
    login_url = await generate_github_login_url(request)
    logger.info(f"Перенаправление на GitHub: {login_url}")
    return RedirectResponse(url=login_url)

# GitHub OAuth: обработка обратного вызова
@router.get("/github/callback", summary="Обратный вызов GitHub")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    """Обрабатывает ответ от GitHub и выдаёт токен."""
    logger.info("Обработка GitHub callback")
    return await AuthService.github_login(request, db)