"""
project.py:
Defines the Project model and its relationships:
- Many-to-Many: Project ↔ Skill (Skills required for the project)
- Many-to-Many: Project ↔ Tag (Tags categorizing projects)
- Many-to-Many: Project ↔ Member (Users who are part of the project)
- Many-to-Many: Project ↔ Applicant (Users who applied to the project)
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base
from .tag import project_tags_association  # Import the project-tags association table

# 🔹 Many-to-Many between Project and Skill
project_skills_association = Table(
    "project_skills",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
)

# 🔹 Many-to-Many between Project and Users (Members)
project_members_association = Table(
    "project_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
)

# 🔹 Many-to-Many between Project and Users (Applicants who applied)
project_applications = Table(
    "project_applications",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))  # Owner of the project

    # Many-to-One: Owner of the project
    owner = relationship("User", back_populates="owned_projects")

    # Many-to-Many: Required skills
    skills = relationship(
        "Skill",
        secondary=project_skills_association,
        back_populates="projects"
    )

    # Many-to-Many: Tags associated with the project
    tags = relationship(
        "Tag",
        secondary=project_tags_association,
        back_populates="projects"
    )

    # Many-to-Many: Users who are **members** of the project
    members = relationship(
        "User",
        secondary=project_members_association,
        back_populates="projects"
    )

    # Many-to-Many: Users who **applied** to the project
    applicants = relationship(
        "User",
        secondary=project_applications,
        back_populates="applied_projects"
    )

    def __repr__(self):
        return f"<Project id={self.id} name={self.name} owner_id={self.owner_id}>"
