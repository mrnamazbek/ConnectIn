"""
request.py:
Хранит "запрос" (например, пользователь хочет присоединиться к проекту,
или отправляет запрос на вступление в команду).
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    # Или team_id = Column(Integer, ForeignKey("teams.id")) - зависит от вашей логики

    message = Column(String, nullable=True)  # Текст или причина запроса
    status = Column(String, default="pending")
    # Можно хранить статусы: "pending", "approved", "rejected" и т.д.

    # Связи
    user = relationship("User", backref="requests")
    project = relationship("Project", backref="requests")
    # Если есть team_id, можно добавить relationship("Team", backref="requests")

    def __repr__(self):
        return f"<Request id={self.id} user_id={self.user_id} project_id={self.project_id}>"
