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