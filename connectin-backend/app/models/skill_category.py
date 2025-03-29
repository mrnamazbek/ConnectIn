from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from .base import Base

class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Связь многие ко многим с моделью Skill через таблицу skill_mappings
    skills = relationship("Skill", secondary="skill_mappings", back_populates="categories")

    def __repr__(self):
        return f"<SkillCategory id={self.id} name={self.name}>"
