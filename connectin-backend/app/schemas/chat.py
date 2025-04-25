from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ConversationType(str, Enum):
    DIRECT = "direct"

class MessageBase(BaseModel):
    content: Optional[str] = Field(default="", max_length=5000)

class MessageCreate(MessageBase):
    conversation_id: int

class MessageOut(MessageBase):
    id: int
    sender_id: int
    timestamp: datetime
    conversation_id: int
    read: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBasicInfo(BaseModel):
    """Basic user info for chat participants"""
    id: int
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    type: ConversationType = ConversationType.DIRECT
    participant_ids: List[int] = Field(..., min_items=1, max_items=10)
    
    @validator('participant_ids')
    def validate_participants(cls, v):
        if not v:
            raise ValueError('Conversation must have at least one participant')
        return v

class ConversationCreate(ConversationBase):
    pass

class ConversationOut(BaseModel):
    id: int
    type: str
    created_at: datetime
    updated_at: datetime
    participants: List[int]
    participants_info: Optional[List[UserBasicInfo]] = None 
    messages: List[MessageOut] = []
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ConversationList(BaseModel):
    id: int
    type: str
    participants: List[int]
    participants_info: Optional[List[UserBasicInfo]] = None
    last_message: Optional[MessageOut] = None
    updated_at: datetime
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True

class MessageList(BaseModel):
    messages: List[MessageOut]
    has_more: bool

class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages"""
    type: str = "message"  # message, typing, read_receipt
    content: Optional[str] = None
    conversation_id: int
    
    class Config:
        extra = "allow"

class ReadReceipt(BaseModel):
    """Schema for read receipt messages"""
    conversation_id: int
    message_ids: List[int]
    read_at: datetime = Field(default_factory=datetime.utcnow) 