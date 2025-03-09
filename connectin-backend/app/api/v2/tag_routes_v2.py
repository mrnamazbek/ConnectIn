"""
Вторая версия API для управления тегами (Tag):
- Получение списка всех тегов
- Создание нового тега
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.services.tag_service import TagService
from app.schemas.tag import TagCreate, TagOut
from app.api.v1.auth_router import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TagOut], summary="Получить список всех тегов")
def read_tags(db: Session = Depends(get_db)):
    """Возвращает список всех тегов."""
    return TagService.get_all_tags(db)

@router.post("/", response_model=TagOut, summary="Создать новый тег")
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Создаёт новый тег."""
    return TagService.create_tag(tag_data, db)