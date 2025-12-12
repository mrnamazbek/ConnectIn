from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List, Optional

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentOut(CommentBase):
    id: int
    user_id: int
    created_at: datetime
    user: Dict[str, Optional[str]] = {"username": "Unknown", "avatar_url": None}

    class Config:
        from_attributes = True
