"""
Этот модуль управляет операциями над skills (Skill) во второй версии API:
- Получение списка всех skills
- Добавление новых skills

Что здесь происходит?

Мы импортировали SkillService из services/skills_service.py.
Эндпоинт GET / вызывает SkillService.get_all_skills для получения списка навыков.
Эндпоинт POST / вызывает SkillService.create_skill для создания нового навыка.
Код стал проще и чище — вся логика ушла в сервис.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.services.skill_service import SkillService
from app.schemas.skill import SkillCreate, SkillOut
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[SkillOut], summary="Получить список всех skills")
def read_skills(db: Session = Depends(get_db)):
    """Получить список всех skills."""
    return SkillService.get_all_skills(db)

@router.post("/", response_model=SkillOut, summary="Создать новый skill")
def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Создать новый skill."""
    return SkillService.create_skill(skill_data, db)