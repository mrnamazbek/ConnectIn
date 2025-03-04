"""
Репозиторий для работы с таблицей тегов (Tag) в базе данных.
"""

from sqlalchemy.orm import Session
from app.models.tag import Tag

class TagRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_tags(self):
        """Получить все теги."""
        return self.db.query(Tag).all()

    def get_tag_by_name(self, name: str):
        """Найти тег по имени."""
        return self.db.query(Tag).filter(Tag.name == name).first()

    def create_tag(self, name: str):
        """Создать новый тег."""
        new_tag = Tag(name=name)
        self.db.add(new_tag)
        self.db.commit()
        self.db.refresh(new_tag)
        return new_tag