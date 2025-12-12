from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    project_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int
    
class NotificationOut(NotificationBase):
    id: int
    user_id: int
    read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 