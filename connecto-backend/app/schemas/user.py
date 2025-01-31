"""
user.py:
Pydantic-схемы для операций над пользователями:
- UserBase: общие поля (email, username, etc.)
- UserCreate: поля, необходимые для регистрации
- UserUpdate: поля, которые можно менять
- UserOut: схема для ответа (без пароля)
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserBase(BaseModel):
    """
    Общие поля, которые могут быть в разных схемах (Create/Update).
    """
    email: EmailStr
    username: Optional[str] = Field(None, max_length=50)
    # Можно добавить full_name, bio и т.д.


class UserCreate(UserBase):
    """
    Схема для создания (регистрации) пользователя.
    Требует пароль (plaintext), который далее будет хэшироваться.
    """
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """
    Схема для обновления данных о пользователе.
    Отдельная, чтобы пароль обновлять по другому эндпоинту, если нужно.
    """
    username: Optional[str] = Field(None, max_length=50)
    # Если хотите позволять менять email, добавьте:
    # email: Optional[EmailStr] = None
    # Здесь всё опционально, т.к. не обязаны менять все поля сразу.


class UserOut(BaseModel):
    """
    Схема, используемая при возврате данных пользователя в ответе API.
    Не содержит поля 'password', 'hashed_password'.
    """
    id: int
    email: EmailStr
    username: Optional[str] = None

    class Config:
        orm_mode = True
        # orm_mode=True позволяет Pydantic корректно читать поля из SQLAlchemy-модели
