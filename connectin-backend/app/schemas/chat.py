# connectin-backend/app/schemas/chat.py
from pydantic import BaseModel, Field, validator, field_validator
from typing import List, Optional, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum

# --- Базовые Типы ---

class ConversationType(str, Enum):
    """Типы разговоров (можно расширить: group, project, team)."""
    DIRECT = "direct"
    # GROUP = "group" # Пример

class UserBasicInfo(BaseModel):
    """Минимальная информация о пользователе для отображения в чате."""
    id: int
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- Схемы Сообщений ---

class MessageBase(BaseModel):
    """Базовая схема сообщения (общие поля)."""
    content: Optional[str] = Field(None, max_length=5000) # Текст опционален для медиа
    # Поля для медиафайлов (ссылка на S3)
    media_url: Optional[str] = Field(None, max_length=2048)
    media_type: Optional[str] = Field(None, max_length=100) # e.g., 'image/jpeg', 'application/pdf'
    media_name: Optional[str] = Field(None, max_length=255) # Original filename

class MessageCreate(MessageBase):
    """Схема для СОЗДАНИЯ сообщения (передается в сервис)."""
    # conversation_id передается через URL параметр в router
    pass

class MessageUpdate(BaseModel):
    """Схема для обновления сообщения (если нужно)."""
    content: Optional[str] = Field(None, max_length=5000)
    # Другие поля, которые можно обновлять

class MessageOut(MessageBase):
    """Схема для ОТОБРАЖЕНИЯ сообщения в REST API (история)."""
    id: int
    sender_id: int
    conversation_id: int
    timestamp: datetime # Время создания из БД
    read: Optional[datetime] = None # Время прочтения (если прочитано)
    sender: Optional[UserBasicInfo] = None # Информация об отправителе (опционально)

    class Config:
        from_attributes = True

class MessageList(BaseModel):
    """Список сообщений для пагинации."""
    messages: List[MessageOut]
    has_more: bool = False

    class Config:
        from_attributes = True

# --- Схемы для Чтения Сообщений ---

class ReadReceipt(BaseModel):
    """Подтверждение прочтения для определенных сообщений."""
    message_ids: List[int] = []
    read_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Схемы WebSocket Сообщений ---

class WebSocketMessage(BaseModel):
    """
    Универсальная схема для сообщений, передаваемых через WebSocket.
    Включает все возможные поля для разных типов событий.
    """
    # Общие поля для всех типов
    type: str # Обязательное поле: 'message', 'typing', 'read', 'status', 'error', etc.
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    conversation_id: int # К какому чату относится

    # Поля для типа 'message' (наследуются от MessageOut, но с опциональностью)
    id: Optional[int] = None # ID сообщения из БД
    sender_id: Optional[int] = None
    sender_username: Optional[str] = None
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    media_name: Optional[str] = None
    read: Optional[str] = None # Время прочтения как строка ISO

    # Поля для типа 'typing'
    user_id_typing: Optional[int] = Field(None, alias="userId") # Используем alias для JS-стиля
    is_typing: Optional[bool] = None

    # Поля для типа 'read'
    user_id_read: Optional[int] = Field(None, alias="userId")
    message_ids: Optional[List[int]] = None

    # Поля для типа 'status'
    user_id_status: Optional[int] = Field(None, alias="userId")
    status: Optional[str] = None # 'online' / 'offline'

    # Поля для типа 'error'
    detail: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True # Разрешает использовать alias

# --- Схемы Разговоров (Conversations) ---

class ConversationCreate(BaseModel):
    """Схема для СОЗДАНИЯ разговора."""
    # ID участников, не включая создателя (добавляется в сервисе)
    participant_ids: List[int]
    type: str = ConversationType.DIRECT.value

    @field_validator('participant_ids')
    def check_participants(cls, v):
        if not v:
            raise ValueError('Conversation must have at least one participant')
        return v

class ConversationOut(BaseModel):
    """Схема для ОТОБРАЖЕНИЯ детальной информации о разговоре."""
    id: int
    type: str
    participants: List[int]
    participants_info: List[UserBasicInfo]
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []
    unread_count: int = 0

    class Config:
        from_attributes = True

class ConversationList(BaseModel):
    """Схема для ОТОБРАЖЕНИЯ разговора в списке чатов пользователя."""
    id: int
    type: str
    participants: List[int]
    participants_info: List[UserBasicInfo]
    last_message: Optional[MessageOut] = None
    updated_at: datetime
    unread_count: int = 0

    class Config:
        from_attributes = True