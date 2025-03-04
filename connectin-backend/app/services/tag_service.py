"""
Сервис для управления тегами (tags): получение списка и создание новых тегов.
"""

from sqlalchemy.orm import Session
from app.repositories.tag_repository import TagRepository
from app.schemas.tag import TagCreate, TagOut

class TagService:
    @staticmethod
    def get_all_tags(db: Session) -> list[TagOut]:
        """Получить все теги из базы данных."""
        repo = TagRepository(db)
        tags = repo.get_all_tags()
        return [TagOut.model_validate(tag) for tag in tags]

    @staticmethod
    def create_tag(tag_data: TagCreate, db: Session) -> TagOut:
        """Создать новый тег, если он не существует."""
        repo = TagRepository(db)
        existing_tag = repo.get_tag_by_name(tag_data.name)
        if existing_tag:
            return TagOut.model_validate(existing_tag)
        new_tag = repo.create_tag(tag_data.name)
        return TagOut.model_validate(new_tag)