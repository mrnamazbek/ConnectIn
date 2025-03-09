"""
Сервис для управления навыками (skills): получение списка и создание новых skills.
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.skill_repository import SkillRepository
from app.schemas.skill import SkillCreate, SkillOut

class SkillService:
    @staticmethod
    def get_all_skills(db: Session) -> list[SkillOut]:
        """Получить все skills из базы данных."""
        repo = SkillRepository(db)
        skills = repo.get_all_skills()
        return [SkillOut.model_validate(skill) for skill in skills]

    @staticmethod
    def create_skill(skill_data: SkillCreate, db: Session) -> SkillOut:
        """Создать новый skill, если он не существует."""
        repo = SkillRepository(db)
        existing_skill = repo.get_skill_by_name(skill_data.name)
        if existing_skill:
            return SkillOut.model_validate(existing_skill)
        new_skill = repo.create_skill(skill_data.name)
        return SkillOut.model_validate(new_skill)