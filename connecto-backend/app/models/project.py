"""
project.py:
Содержит модель Project и (опционально) промежуточную таблицу project_skills,
если вы хотите связать проекты с набором скиллов (Many-to-Many).

При желании можно добавить связь Project ↔ User (владелец проекта) 
или Project ↔ Team (если проект принадлежит команде).
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base

# Пример: связь Many-to-Many между Project и Skill
project_skills_association = Table(
    "project_skills",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Опционально: связь с владельцем (если хотите)
    # owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # owner = relationship("User", back_populates="projects")

    # Если хотим Many-to-Many со скиллами
    skills = relationship(
        "Skill",
        secondary=project_skills_association,
        back_populates="projects"
    )

    def __repr__(self):
        return f"<Project id={self.id} name={self.name}>"
