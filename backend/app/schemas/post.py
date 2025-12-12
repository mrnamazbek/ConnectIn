from pydantic import BaseModel
from typing import Optional, List, Dict

class PostBase(BaseModel):
    title: str
    content: str
    post_type: str  # "news", "project", "team"

class PostCreate(PostBase):
    project_id: Optional[int] = None
    team_id: Optional[int] = None
    tag_ids: List[int] = []  # Only for project posts

class PostOut(BaseModel):
    id: int
    title: str
    content: str
    post_type: str
    author_id: Optional[int] = None
    project_id: Optional[int] = None
    team_id: Optional[int] = None
    tags: List[str] = []
    date: Optional[str] = None
    author: Dict[str, Optional[str]] = {"username": "Unknown", "avatar_url": None}
    likes_count: int = 0
    comments_count: int = 0
    saves_count: int = 0

    class Config:
        from_attributes = True