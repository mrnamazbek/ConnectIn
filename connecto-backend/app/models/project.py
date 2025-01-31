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
from .tag import project_tags_association  # Import the project-tags association table

# Many-to-Many between Project and Skill
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

    # Many-to-Many with Skills
    skills = relationship(
        "Skill",
        secondary=project_skills_association,
        back_populates="projects"
    )

    # Many-to-Many with Tags (fixing missing relationship)
    tags = relationship(
        "Tag",
        secondary=project_tags_association,  # Connects to the `Tag` model
        back_populates="projects"
    )

    def __repr__(self):
        return f"<Project id={self.id} name={self.name}>"
