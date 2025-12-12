"""
Модуль для управления операциями над Skill.
Доступные операции:
- Получение списка всех skills.
- Создание нового skill (если skill с таким именем уже существует, возвращается существующий).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillOut
from app.api.v1.auth import get_current_user
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/", response_model=List[SkillOut], summary="Получить список всех skills")
def get_all_skills(db: Session = Depends(get_db)):
    """
    Возвращает список всех skills.
    """
    skills = db.query(Skill).all()
    return skills

@router.post("/", response_model=SkillOut, summary="Создать новый skill")
def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Создаёт новый skill, если с таким именем его ещё нет.
    Если skill уже существует, возвращает существующий объект.

    :param skill_data: Данные для создания skill.
    :param db: Сессия базы данных.
    :param current_user: Текущий аутентифицированный пользователь.
    :return: Объект созданного или существующего skill.
    """
    existing_skill = db.query(Skill).filter(Skill.name == skill_data.name).first()
    if existing_skill:
        # Можно выбросить исключение Conflict (409), если требуется уведомить пользователя об ошибке.
        return existing_skill

    new_skill = Skill(name=skill_data.name)
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill
