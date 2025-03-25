import uuid
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy import Column, String, ForeignKey, DateTime, Text



# models/todo_comment.py
class TodoComment(Base):
    __tablename__ = "todo_comments"

    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow())

    author_id = Column(Integer, ForeignKey("users.id"))
    todo_id = Column(Integer, ForeignKey("todos.id"))

    author = relationship("User", back_populates="todo_comments")
    todo = relationship("Todo", back_populates="comments")