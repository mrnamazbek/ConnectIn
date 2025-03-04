from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base
from relations.associations import project_skills_association, project_tags_association, project_members_association, project_applications

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    # ✅ The owner relationship
    owner = relationship("User", back_populates="owned_projects")

    # ✅ Many-to-Many: Required skills
    skills = relationship("Skill", secondary=project_skills_association, back_populates="projects")

    # ✅ Many-to-Many: Tags associated with the project
    tags = relationship("Tag", secondary=project_tags_association, back_populates="projects")

    # ✅ Many-to-Many: Users who are **members** of the project
    members = relationship("User", secondary=project_members_association, back_populates="projects")

    # ✅ Many-to-Many: Users who **applied** to the project
    applicants = relationship("User", secondary=project_applications, back_populates="applied_projects")

    # ✅ A project can have multiple posts
    posts = relationship("Post", back_populates="project", cascade="all, delete")
    
    comments = relationship("ProjectComment", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project id={self.id} name={self.name} owner_id={self.owner_id}>"
