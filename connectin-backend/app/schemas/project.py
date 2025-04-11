"""
project.py:
Схемы для CRUD-операций над проектами:
- ProjectBase: общие поля (name, description)
- ProjectCreate: поля, нужные при создании
- ProjectUpdate: поля, которые можно менять
- ProjectOut: ответ API с дополнительными данными (список участников, рейтинг и т.д.)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from app.enums import ApplicationStatus
from .skill import SkillOut
from .comment import CommentOut

class ApplicationDecisionRequest(BaseModel):
    decision: ApplicationStatus

class ApplicationDecisionResponse(BaseModel):
    decision: ApplicationStatus

class ApplicationOut(BaseModel):
    """Schema for outputting application details"""
    user_id: int
    username: str


class ProjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    
class TagOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectCreate(ProjectBase):
    """
    Схема для создания проекта.
    Добавлены теги и навыки.
    """
    tag_ids: List[int] = []  # ✅ IDs of selected tags
    skill_ids: List[int] = []  # ✅ IDs of required skills


class ProjectUpdate(BaseModel):
    """
    Схема обновления проекта.
    """
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    tag_ids: List[int] = []  # ✅ Allow updating tags
    skill_ids: List[int] = []  # ✅ Allow updating skills

class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    owner: UserOut
    members: List[UserOut] = []
    tags: List[TagOut] = []
    skills: List[SkillOut] = []
    comments_count: int = 0
    vote_count: int = 0

    class Config:
        from_attributes = True
        

class ProjectProfileOut(BaseModel):
    project: ProjectOut
    members: List[UserOut]
    applications: Optional[List[UserOut]] = None
    comments: List[CommentOut]