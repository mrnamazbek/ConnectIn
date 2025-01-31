"""
article.py:
Модель Article (статьи), а также пример Many-to-Many с тегами (article_tags),
или One-to-Many с комментариями.

В коде для наглядности:
- article_tags_association (связывает статьи и теги)
- класс Article
- (опционально) класс Comment

Если у вас есть user_article_interactions, можно добавить это здесь
или в отдельном файле (interaction.py).
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base

# Пример: связь Many-to-Many статьи ↔ теги
article_tags_association = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    extend_existing=True
)


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)

    # Пример: если у статьи есть автор
    # author_id = Column(Integer, ForeignKey("users.id"))
    # author = relationship("User", back_populates="articles")

    # Пример: Many-to-Many с тегами
    tags = relationship(
        "Tag",
        secondary=article_tags_association,
        back_populates="articles"
    )

    # Пример: One-to-Many связь c комментариями
    comments = relationship("Comment", back_populates="article", cascade="all, delete")

    def __repr__(self):
        return f"<Article id={self.id} title={self.title}>"


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)

    # ForeignKey на статью
    article_id = Column(Integer, ForeignKey("articles.id"))
    article = relationship("Article", back_populates="comments")

    def __repr__(self):
        return f"<Comment id={self.id}>"
