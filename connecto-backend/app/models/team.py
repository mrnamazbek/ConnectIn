"""
team.py:
Определяет модель Team и связывает её с User (через user_teams_association).
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .base import Base
from .user import user_teams_association

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    # Можно добавить leader_id, если хотите хранить id владельца команды

    # Связь с пользователями (через user_teams_association)
    members = relationship(
        "User",
        secondary=user_teams_association,
        back_populates="teams"
    )

    def __repr__(self):
        return f"<Team id={self.id} name={self.name}>"
