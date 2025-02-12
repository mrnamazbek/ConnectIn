"""
Этот модуль отвечает за:
1. Регистрацию пользователей (эндпоинт /register).
2. Авторизацию и получение JWT (эндпоинт /login).
3. Получение данных текущего пользователя (эндпоинты, зависящие от токена).
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

# Вновь включаем импорт схем
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.utils.auth import hash_password, verify_password
from app.database.connection import get_db
from app.core.config import settings
from fastapi.responses import RedirectResponse
from app.utils.auth import generate_google_login_url, handle_google_callback
from app.models.user import User

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Настройка для JWT
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 минут (можно регулировать)


@router.post("/register", response_model=UserOut, summary="Создать аккаунт")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрирует нового пользователя.
    Проверяем, нет ли уже такого email в базе.
    Храним пароль в хэше (bcrypt), а не 'в открытую'.
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
    return new_user


@router.post("/login", summary="Войти в систему")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Эндпоинт для входа в систему (получение JWT-токена).
    Принимает form_data c полями:
    - username (используется как email)
    - password
    Возвращает access_token при успешной аутентификации.
    """
    
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль."
        )

    # Генерируем JWT-токен
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "exp": datetime.utcnow() + access_token_expires
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

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

    - Декодирует JWT-токен и получает email пользователя.
    - Проверяет существование пользователя в базе.
    - Если что-то не так (токен истёк, некорректен или пользователь не найден) — выбрасывает HTTPException.
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
    Возвращает данные текущего пользователя (из токена).
    """
    return current_user


#---------------------GOOGLE oAUTH----------------------------------------------
@router.get("/google/login", summary="Google Login")
async def google_login(request: Request):
    """
    Генерирует URL для авторизации через Google.
    """
    login_url = await generate_google_login_url(request)

    if not login_url:
        raise HTTPException(
            status_code=500,
            detail="Не удалось сформировать Google OAuth URL"
        )

    return RedirectResponse(url=login_url)  # ✅ Теперь это правильный URL!


@router.get("/google/callback", summary="Google Callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Обрабатывает ответ от Google OAuth и регистрирует/логинит пользователя.
    """
    user_info = await handle_google_callback(request)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось получить данные пользователя через Google."
        )

    # 🛠 Генерируем username, если его нет
    username = user_info.get("name", "").replace(" ", "_") or user_info["email"].split("@")[0]

    # Проверяем, есть ли пользователь в базе
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if not user:
        # Создаем нового пользователя
        user = User(
            email=user_info["email"],
            username=username,  # ✅ Исправлено
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Возвращаем JWT токен (или перенаправляем)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "exp": datetime.utcnow() + access_token_expires,
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info,
    }
