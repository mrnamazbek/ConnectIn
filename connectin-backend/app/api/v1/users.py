"""
Этот модуль управляет операциями над пользователями (User):
- Получение списка всех пользователей.
- Просмотр и обновление профиля текущего пользователя.
- Удаление своей учетной записи.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import HttpUrl
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.user import User, Education, Experience
from app.models.skill import Skill
from app.schemas.user import UserOut, UserUpdate, EducationCreate, ExperienceCreate, EducationUpdate, ExperienceUpdate, EducationOut, ExperienceOut
from app.schemas.skill import SkillOut
from app.api.v1.auth import get_current_user

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

@router.get("/search", response_model=List[UserOut], summary="Поиск пользователей")
def search_users(
    query: str,
    db: Session = Depends(get_db)
):
    if not query:
        return []

    users = db.query(User).filter(
        (User.username.ilike(f"%{query}%")) |
        (User.email.ilike(f"%{query}%"))
    ).all()

    return users

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

# ✅ Add Education Entry
@router.post("/me/education", summary="Добавить образование", response_model=EducationOut)
def add_education(
    education_data: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_education = Education(user_id=current_user.id, **education_data.dict())
    db.add(new_education)
    db.commit()
    db.refresh(new_education)
    return new_education


# ✅ Update Education Entry
@router.put("/me/education/{education_id}", summary="Обновить запись об образовании", response_model=EducationCreate)
def update_education(
    education_id: int,
    education_data: EducationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    education = db.query(Education).filter(Education.id == education_id, Education.user_id == current_user.id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Запись об образовании не найдена")

    for key, value in education_data.dict(exclude_unset=True).items():
        setattr(education, key, value)

    db.commit()
    db.refresh(education)
    return education


# ✅ Delete Education Entry
@router.delete("/me/education/{education_id}", summary="Удалить запись об образовании")
def delete_education(
    education_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    education = db.query(Education).filter(Education.id == education_id, Education.user_id == current_user.id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Запись об образовании не найдена")

    db.delete(education)
    db.commit()
    return {"detail": "Образование удалено"}


# ✅ Add Experience Entry
@router.post("/me/experience", summary="Добавить опыт работы", response_model=ExperienceOut)
def add_experience(
    experience_data: ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_experience = Experience(user_id=current_user.id, **experience_data.dict())
    db.add(new_experience)
    db.commit()
    db.refresh(new_experience)
    return new_experience


# ✅ Update Experience Entry
@router.put("/me/experience/{experience_id}", summary="Обновить запись о работе", response_model=ExperienceCreate)
def update_experience(
    experience_id: int,
    experience_data: ExperienceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experience = db.query(Experience).filter(Experience.id == experience_id, Experience.user_id == current_user.id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Запись о работе не найдена")

    for key, value in experience_data.dict(exclude_unset=True).items():
        setattr(experience, key, value)

    db.commit()
    db.refresh(experience)
    return experience


# ✅ Delete Experience Entry
@router.delete("/me/experience/{experience_id}", summary="Удалить запись о работе")
def delete_experience(
    experience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experience = db.query(Experience).filter(Experience.id == experience_id, Experience.user_id == current_user.id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Запись о работе не найдена")

    db.delete(experience)
    db.commit()
    return {"detail": "Опыт работы удален"}

@router.post("/me/skills", response_model=SkillOut, status_code=status.HTTP_201_CREATED, summary="Добавить навык пользователю")
def add_skill_to_user(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Добавляет навык текущему пользователю по ID навыка.
    """
    # Проверяем существование навыка
    skill = db.query(Skill).get(skill_id)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Навык не найден"
        )
    
    # Проверяем, что навык еще не добавлен
    if skill in current_user.skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Навык уже добавлен"
        )
    
    # Добавляем связь
    current_user.skills.append(skill)
    db.commit()
    
    return skill

@router.delete("/me/skills/{skill_id}", summary="Удалить навык у пользователя")
def remove_skill_from_user(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Удаляет навык у текущего пользователя по ID навыка.
    """
    # Ищем навык среди добавленных у пользователя
    skill = next((s for s in current_user.skills if s.id == skill_id), None)
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Навык не найден у пользователя"
        )
    
    # Удаляем связь
    current_user.skills.remove(skill)
    db.commit()
    
    return {"message": "Навык успешно удален"}

@router.get("/me/skills", response_model=List[SkillOut], summary="Получить навыки пользователя")
def get_user_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Возвращает список всех навыков текущего пользователя.
    """
    return current_user.skills

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
