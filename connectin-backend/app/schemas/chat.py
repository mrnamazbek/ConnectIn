from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MessageCreate(BaseModel):
    conversation_id: int
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: int
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    type: str  # "direct", "project", "team"
    participant_ids: List[int]  # 🔹 User IDs in chat
    project_id: Optional[int] = None
    team_id: Optional[int] = None

class ConversationOut(BaseModel):
    id: int
    type: str
    project_id: Optional[int] = None
    team_id: Optional[int] = None
    participants: List[int] 
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class ConversationList(BaseModel):
    id: int
    type: str
    project_id: Optional[int] = None
    team_id: Optional[int] = None
    participants: List[int]
    last_message: Optional[MessageOut] = None
    unread_count: int = 0
    updated_at: datetime

    class Config:
        from_attributes = True

class MessageList(BaseModel):
    messages: List[MessageOut]
    has_more: bool