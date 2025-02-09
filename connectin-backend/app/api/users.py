"""
Этот модуль управляет операциями над самими пользователями (User):
- Получение списка всех пользователей
- Просмотр профиля конкретного пользователя
- Обновление собственных данных
- (Опционально) Удаление своей учётной записи
"""

from fastapi import APIRouter, Depends, HTTPException, status
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
    В продакшене часто добавляют фильтры, например по статусу, роли и т.д.
    """
    users = db.query(User).all()
    return users


@router.get("/me", response_model=UserOut, summary="Мой профиль (требуется токен)")
def read_own_profile(current_user: User = Depends(get_current_user)):
    """
    Возвращает данные о текущем пользователе.
    (По сути, то же, что и /auth/me, но можно расширить).
    """
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

@router.get("/{user_id}", response_model=UserOut, summary="Профиль конкретного пользователя")
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает данные пользователя по его ID.
    Внимание: иногда нужно скрывать email/телефон, если это чужой профиль.
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
    Позволяет пользователю обновлять своё имя, аватар или другие поля.
    Пароль меняется в /auth (можно сделать отдельно).
    """
    # Если UserUpdate содержит поля, мы их применяем
    if user_data.username is not None:
        current_user.username = user_data.username
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    # Добавьте любые поля, которые есть в вашей модели User

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/skills", summary="Добавить навык в профиль")
def add_skill_to_profile(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю добавлять навык в свой профиль.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")

    if skill in current_user.skills:
        raise HTTPException(status_code=400, detail="Этот навык уже добавлен в профиль")

    current_user.skills.append(skill)
    db.commit()
    return {"detail": "Навык успешно добавлен"}

@router.delete("/me/skills/{skill_id}", summary="Удалить навык из профиля")
def remove_skill_from_profile(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Удаляет навык у текущего пользователя.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")

    # Проверяем, есть ли этот навык у пользователя
    if skill not in current_user.skills:
        raise HTTPException(status_code=400, detail="Этот навык не добавлен у пользователя")

    # Удаляем навык
    current_user.skills.remove(skill)
    db.commit()
    return {"detail": "Навык удалён"}


@router.delete("/me", summary="Удалить свою учётную запись")
def delete_own_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Позволяет пользователю удалить свою учётную запись.
    В реальном проекте иногда делают "deactivate", чтобы не терять данные.
    """
    db.delete(current_user)
    db.commit()
    return {"detail": "Ваш аккаунт был удалён"}

