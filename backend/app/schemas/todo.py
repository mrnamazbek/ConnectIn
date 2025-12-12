# app/schemas/todo.py

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Union
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    BLOCKED = "blocked"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskAssignmentRole(str, Enum):
    ASSIGNEE = "assignee"
    REVIEWER = "reviewer"
    WATCHER = "watcher"

class UserBasic(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class TaskAssignment(BaseModel):
    user: UserBasic
    role: TaskAssignmentRole
    assigned_at: datetime
    
    class Config:
        from_attributes = True

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    estimated_hours: Optional[float] = None
    due_date: Optional[datetime] = None

class TodoCreate(TodoBase):
    project_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = []

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    project_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = None

class TodoInDB(TodoBase):
    id: int
    is_completed: bool
    user_id: int
    project_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TodoDetail(TodoInDB):
    assignees: List[UserBasic] = []
    watchers: List[UserBasic] = []
    comment_count: int = 0
    tags: List[str] = []
    
    class Config:
        from_attributes = True

class TodosResponse(BaseModel):
    items: List[TodoDetail]
    total: int
    page: int
    page_size: int
    total_pages: int
