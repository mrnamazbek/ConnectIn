"""
Этот модуль управляет операциями над skills (Skill):
- Получение списка всех тегов
- Добавление новых тегов
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillOut
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[SkillOut], summary="Получить список всех skills")
def read_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()


@router.post("/", response_model=SkillOut, summary="Создать новый skill")
def create_skill(
    skill_data: SkillCreate, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """
    Создаёт новый skill. Если такой skill уже существует, он не создаётся повторно.
    """
    existing_skill = db.query(Skill).filter(Skill.name == skill_data.name).first()
    if existing_skill:
        return existing_skill 

    new_skill = Skill(name=skill_data.name)
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill
