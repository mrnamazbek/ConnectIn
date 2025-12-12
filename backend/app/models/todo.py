# app/models/todo.py

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from .base import Base
from .relations.associations import todo_tags_association, todo_watchers_association
import enum

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    BLOCKED = "blocked"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    # New fields for enhanced task management
    status = Column(String, default=TaskStatus.TODO, nullable=False)
    priority = Column(String, default=TaskPriority.MEDIUM, nullable=False)
    estimated_hours = Column(Float, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User assignment (original owner)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Project association
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="todos")
    project = relationship("Project", back_populates="todos")

    # Watchers
    watchers = relationship(
        "User",
        secondary=todo_watchers_association,
        back_populates="watched_todos"
    )

    # Assignees (will be implemented through a new task_assignments table)

    # Теги
    tags = relationship(
        "Tag",
        secondary=todo_tags_association,
        back_populates="todos"
    )

    # Комментарии
    comments = relationship("TodoComment", back_populates="todo", cascade="all, delete-orphan")
