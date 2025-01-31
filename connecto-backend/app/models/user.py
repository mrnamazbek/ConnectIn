"""
user.py:
Определяет модель User и (опционально) промежуточную таблицу user_teams 
для связи Many-to-Many между пользователями и командами.
"""

from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

# Пример промежуточной таблицы для связи Many-to-Many:
user_teams_association = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)  # Добавили username
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Связь с командами (через user_teams_association)
    teams = relationship(
        "Team",
        secondary=user_teams_association,
        back_populates="members"
    )

    def __repr__(self):
        return f"<User id={self.id} username={self.username} email={self.email}>"
