from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from .base import Base, TimestampMixin


class Project(Base, TimestampMixin):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(Enum('planning', 'active', 'completed', 'cancelled', name='project_status'))
    start_date = Column(Date)
    end_date = Column(Date)
    search_vector = Column(TSVECTOR)  # Для полнотекстового поиска

    owner_id = Column(Integer, ForeignKey('users.id'))
    team_id = Column(Integer, ForeignKey('teams.id'))

    # Relationships
    owner = relationship("User", back_populates="projects")
    team = relationship("Team", back_populates="projects")
    required_skills = relationship("ProjectSkill", back_populates="project")
    tags = relationship("ProjectTag", back_populates="project")
    comments = relationship("Comment", back_populates="project")
    interactions = relationship("UserProjectInteraction", back_populates="project")
    requests = relationship("Request", back_populates="project")