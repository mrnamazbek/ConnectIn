"""
user.py:
Defines the User model and the Many-to-Many relationship:
- User ↔ Team (Teams the user is a part of)
- User ↔ Project (Projects the user is a member of)
- User ↔ Applications (Projects the user has applied to)
"""

from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .project import project_members_association, project_applications

# Many-to-Many relationship between User and Team
user_teams_association = Table(
    "user_teams",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Relationship: User belongs to multiple teams
    teams = relationship(
        "Team",
        secondary=user_teams_association,
        back_populates="members"
    )

    # Relationship: User owns multiple projects
    owned_projects = relationship(
        "Project",
        back_populates="owner"
    )

    # Relationship: User is a member of multiple projects
    projects = relationship(
        "Project",
        secondary=project_members_association,
        back_populates="members"
    )

    # Relationship: User has applied to multiple projects
    applied_projects = relationship(
        "Project",
        secondary=project_applications,
        back_populates="applicants"
    )

    def __repr__(self):
        return f"<User id={self.id} username={self.username} email={self.email}>"
