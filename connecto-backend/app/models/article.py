from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from .base import Base, TimestampMixin


class Article(Base, TimestampMixin):
    __tablename__ = 'articles'

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    rating = Column(Float, default=0.0)
    search_vector = Column(TSVECTOR)  # Для полнотекстового поиска

    author_id = Column(Integer, ForeignKey('users.id'))

    # Relationships
    author = relationship("User", back_populates="articles")
    tags = relationship("ArticleTag", back_populates="article")
    comments = relationship("Comment", back_populates="article")
    interactions = relationship("UserArticleInteraction", back_populates="article")