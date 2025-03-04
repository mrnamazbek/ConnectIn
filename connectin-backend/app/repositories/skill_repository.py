"""
Репозиторий для работы с таблицей skills в базе данных.
"""

from sqlalchemy.orm import Session
from app.models.skill import Skill

class SkillRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_skills(self):
        """Получить все skills."""
        return self.db.query(Skill).all()

    def get_skill_by_name(self, name: str):
        """Найти skill по имени."""
        return self.db.query(Skill).filter(Skill.name == name).first()

    def create_skill(self, name: str):
        """Создать новый skill."""
        new_skill = Skill(name=name)
        self.db.add(new_skill)
        self.db.commit()
        self.db.refresh(new_skill)
        return new_skill