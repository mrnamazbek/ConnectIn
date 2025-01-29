"""
Этот модуль отвечает за:
1. Регистрацию пользователей (эндпоинт /register).
2. Авторизацию и получение JWT (эндпоинт /login).
3. Получение данных текущего пользователя (эндпоинты, зависящие от токена).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt

from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.utils.auth import hash_password, verify_password
from app.database.connection import get_db
from app.core.config import settings  # Предполагаем, что здесь SECRET_KEY и прочие настройки

router = APIRouter()

# Указываем, где искать tokenUrl (эндпоинт для получения токена)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Берём секретный ключ и алгоритм из конфига
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"


@router.post("/register", response_model=UserOut, summary="Создать аккаунт")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрирует нового пользователя. Проверяем, нет ли уже email в базе.
    Храним пароль в хэше, чтобы не хранить его "в открытую".
    """
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email уже зарегистрирован"
        )

    hashed_pw = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw,
        # Дополнительные поля (username, имя, фамилия и т.д.) при необходимости
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
    Эндпоинт для входа в систему.
    Вводим email (username) и пароль.
    Если корректно, получаем JWT-токен.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )

    # Генерируем JWT-токен (действует 60 минут, можно настроить на свой срок)
    access_token_expires = timedelta(minutes=60)
    payload = {
        "sub": user.email,
        "exp": datetime.utcnow() + access_token_expires
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": access_token, "token_type": "bearer"}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Зависимость (dependency), которая извлекает пользователя из токена.
    Если токен некорректен, выбрасываем 401.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Не удалось определить пользователя по токену"
            )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Токен недействителен или истёк"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь не найден"
        )
    return user


@router.get("/me", response_model=UserOut, summary="Текущий пользователь")
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Тестовый эндпоинт, чтобы проверить, что вы можете получить
    данные о себе (после логина) по токену.
    """
    return current_user
