"""
Этот модуль управляет операциями над тегами (Tag):
- Получение списка всех тегов
- Добавление новых тегов
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagOut
from app.api.v1.auth import get_current_user
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/", response_model=List[TagOut], summary="Получить список всех тегов")
def read_tags(db: Session = Depends(get_db)):
    """
    Возвращает список всех тегов.
    """
    return db.query(Tag).all()


@router.post("/", response_model=TagOut, summary="Создать новый тег")
def create_tag(
    tag_data: TagCreate, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """
    Создаёт новый тег. Если такой тег уже существует, он не создаётся повторно.
    """
    existing_tag = db.query(Tag).filter(Tag.name == tag_data.name).first()
    if existing_tag:
        return existing_tag  # Возвращаем уже существующий тег

    new_tag = Tag(name=tag_data.name)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag
