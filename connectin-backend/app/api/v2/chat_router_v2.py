"""
Вторая версия API для управления беседами и сообщениями:
- Получение списка всех бесед пользователя
- Получение конкретной беседы
- Создание новой беседы
- Отправка сообщения в беседу
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.schemas.chat import MessageCreate, MessageOut, ConversationCreate, ConversationOut
from app.services.chat_service import ChatService
from app.api.v1.auth_router import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все беседы пользователя."""
    return ChatService.get_user_conversations(current_user, db)

@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить конкретную беседу по ID."""
    return ChatService.get_conversation(conversation_id, current_user, db)

@router.post("/", response_model=ConversationOut)
def create_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую беседу."""
    return ChatService.create_conversation(conversation_data, current_user, db)

@router.post("/message", response_model=MessageOut)
def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить сообщение в беседу."""
    return ChatService.send_message(message_data, current_user, db)