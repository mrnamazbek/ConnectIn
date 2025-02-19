from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .project import project_skills_association
from .user import user_skills_association

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # ✅ Many-to-Many: Users & Skills
    users = relationship("User", secondary=user_skills_association, back_populates="skills")

    # ✅ Many-to-Many: Projects & Skills
    projects = relationship("Project", secondary=project_skills_association, back_populates="skills")

    def __repr__(self):
        return f"<Skill id={self.id} name={self.name}>"
