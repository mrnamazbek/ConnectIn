# app/schemas/todo.py

from pydantic import BaseModel
from typing import Optional

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None

class TodoInDB(TodoBase):
    id: int
    is_completed: bool
    user_id: int

    class Config:
        from_attributes = True
