# app/models/team.py

from sqlalchemy import Column, String, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from base import Base

# Association table for many-to-many relationship between Team and Project
team_project_association = Table(
    "team_project",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("team.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("project.id"), primary_key=True),
)

class Team(Base):
    __tablename__ = "team"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    members = Column(String, nullable=False)  # Comma-separated list of member names or IDs

    # Relationships
    projects = relationship("Project", secondary=team_project_association, back_populates="teams")
    users = relationship("User", back_populates="team")

    def __repr__(self):
        return f"<Team(name={self.name}, members={self.members})>"
