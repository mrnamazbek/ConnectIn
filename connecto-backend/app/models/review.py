"""
review.py:
Хранит отзывы (review) или оценки (rating).
Например, пользователь оставляет отзыв о проекте или о другом пользователе.
"""

from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    # Кто написал отзыв
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # О чём отзыв (например, о проекте)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    # Или можно хранить review для команды, team_id = Column(...)

    rating = Column(Integer, nullable=True)  # Оценка (1..5, например)
    text = Column(Text, nullable=True)       # Текст отзыва

    # Связи
    user = relationship("User", backref="reviews")
    project = relationship("Project", backref="reviews")

    def __repr__(self):
        return f"<Review id={self.id} user_id={self.user_id} rating={self.rating}>"
