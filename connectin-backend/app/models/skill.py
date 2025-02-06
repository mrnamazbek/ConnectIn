from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .project import project_skills_association
from .user import user_skills_association

# Many-to-Many: Post ↔ Skills
post_skills_association = Table(
    "post_skills",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
    extend_existing=True
)

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # ✅ Many-to-Many: Users & Skills
    users = relationship("User", secondary=user_skills_association, back_populates="skills")

    # ✅ Many-to-Many: Projects & Skills
    projects = relationship("Project", secondary=project_skills_association, back_populates="skills")

    # ✅ Many-to-Many: Posts & Skills
    posts = relationship("Post", secondary=post_skills_association, back_populates="skills")

    def __repr__(self):
        return f"<Skill id={self.id} name={self.name}>"
