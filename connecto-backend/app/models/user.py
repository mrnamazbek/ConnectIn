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

# --- Moved from old_models.py ---
from sqlalchemy.ext.declarative import declarative_base

# Базовый класс для всех моделей
Base = declarative_base()


# --- Moved from interaction.py ---
from sqlalchemy import Column, Integer, Enum, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base


class UserArticleInteraction(Base):
    __tablename__ = 'user_article_interactions'

    id = Column(Integer, primary_key=True)
    interaction_type = Column(Enum('view', 'like', 'bookmark', name='interaction_type'))

    user_id = Column(Integer, ForeignKey('users.id'))
    article_id = Column(Integer, ForeignKey('articles.id'))

    user = relationship("User")
    article = relationship("Article", back_populates="interactions")


class UserProjectInteraction(Base):
    __tablename__ = 'user_project_interactions'

    id = Column(Integer, primary_key=True)
    interaction_type = Column(Enum('view', 'like', 'bookmark', name='interaction_type'))

    user_id = Column(Integer, ForeignKey('users.id'))
    project_id = Column(Integer, ForeignKey('projects.id'))

    user = relationship("User")
    project = relationship("Project", back_populates="interactions")