from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    bio = Column(Text)
    education = Column(Text)
    experience = Column(Text)
    github_url = Column(String(255))
    linkedin_url = Column(String(255))

    # Relationships
    skills = relationship("UserSkill", back_populates="user")
    teams = relationship("UserTeam", back_populates="user")
    articles = relationship("Article", back_populates="author")
    projects = relationship("Project", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")
    requests = relationship("Request", back_populates="user")