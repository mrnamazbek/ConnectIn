from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .relations.associations import project_skills_association, user_skills_association, skill_mappings

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Relationship with categories
    categories = relationship("SkillCategory", secondary=skill_mappings, back_populates="skills")

    # Relationship with users
    users = relationship("User", secondary=user_skills_association, back_populates="skills")

    # Relationship with projects
    projects = relationship("Project", secondary=project_skills_association, back_populates="skills")

    def __repr__(self):
        return f"<Skill id={self.id} name={self.name}>"
