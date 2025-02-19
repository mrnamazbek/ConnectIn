"""
Этот модуль управляет операциями над пользователями (User):
- Получение списка всех пользователей.
- Просмотр и обновление профиля текущего пользователя.
- Удаление своей учетной записи.
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import HttpUrl
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.user import User, Education, Experience
from app.models.skill import Skill
from app.schemas.user import UserOut, UserUpdate, EducationCreate, ExperienceCreate, EducationUpdate, ExperienceUpdate, EducationOut, ExperienceOut
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[UserOut], summary="Получить список всех пользователей")
def read_users(db: Session = Depends(get_db)):
    """
    Возвращает список всех зарегистрированных пользователей.
    """
    users = db.query(User).all()
    return users

@router.get("/me", response_model=UserOut, summary="Мой профиль (требуется токен)")
def read_own_profile(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные текущего пользователя.
    """
    return current_user

@router.get("/{user_id}", response_model=UserOut, summary="Профиль конкретного пользователя")
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает данные пользователя по его ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.put("/me", response_model=UserOut, summary="Обновить свой профиль")
def update_own_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю обновлять данные профиля.
    """
    if user_data.email and user_data.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот email уже используется другим пользователем."
            )
    if user_data.username and user_data.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это имя пользователя уже занято."
            )
    update_data = user_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if isinstance(value, HttpUrl):
            update_data[key] = str(value)
        setattr(current_user, key, update_data[key])
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", summary="Удалить свою учётную запись")
def delete_own_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю удалить свою учетную запись.
    """
    db.delete(current_user)
    db.commit()
    return {"detail": "Ваш аккаунт был удалён"}
