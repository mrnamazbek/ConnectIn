from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .associations import project_skills_association, user_skills_association

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Связь многие ко многим с категориями через таблицу skill_mappings
    categories = relationship("SkillCategory", secondary="skill_mappings", back_populates="skills")

    # Связь с пользователями через существующую таблицу user_skills (предполагается, что она уже определена)
    users = relationship("User", secondary="user_skills", back_populates="skills")

    # ✅ Many-to-Many: Users & Skills
    users = relationship("User", secondary=user_skills_association, back_populates="skills")

    # ✅ Many-to-Many: Projects & Skills
    projects = relationship("Project", secondary=project_skills_association, back_populates="skills")

    def __repr__(self):
        return f"<Skill id={self.id} name={self.name}>"
