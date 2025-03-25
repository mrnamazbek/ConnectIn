# app/models/todo.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .associations import todo_tags_association, todo_watchers_association


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Связь с пользователем
    user = relationship("User", back_populates="todos")

    # Наблюдатели
    watchers = relationship(
        "User",
        secondary=todo_watchers_association,
        back_populates="watched_todos"
    )

    # Теги
    tags = relationship(
        "Tag",
        secondary=todo_tags_association,
        back_populates="todos"
    )

    # Комментарии
    comments = relationship("TodoComment", back_populates="todo", cascade="all, delete-orphan")
