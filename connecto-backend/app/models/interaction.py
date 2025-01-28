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