"""
Project Service schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    title: str
    description: str
    tech_stack: List[str] = []
    required_roles: List[str] = []
    difficulty_level: str = "intermediate"
    deadline: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    required_roles: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str
    owner_id: int
    tech_stack: List[str]
    required_roles: List[str]
    difficulty_level: str
    status: str
    is_active: bool
    created_at: datetime
    deadline: Optional[datetime]
    
    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    message: Optional[str] = None
