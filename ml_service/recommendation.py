"""
recommendation.py:
Хранит "рекомендации" (например, когда один пользователь рекомендует другого или пишет рекомендательное письмо).
Тут может быть связь "от кого" (from_user) и "кому" (to_user).
"""

from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)

    # Пример полей: кто рекомендует, кому, и текст рекомендации
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=True)

    # Связи с моделью User (две внешние связи на ту же таблицу users)
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])

    def __repr__(self):
        return f"<Recommendation id={self.id} from={self.from_user_id} to={self.to_user_id}>"
