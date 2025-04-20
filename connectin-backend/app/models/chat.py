from datetime import datetime
from enum import Enum
from sqlalchemy import Column, ForeignKey, Integer, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship, validates
from .base import Base
from .relations.associations import conversation_participants


class ConversationType(str, Enum):
    """Типы чатов с автоматическим приведением к строке"""
    direct = "direct"  # Личная переписка
    project = "project"  # Чат проекта
    team = "team"  # Чат команды


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, comment="Уникальный ID чата")
    type = Column(SQLEnum(ConversationType), nullable=False, comment="Тип чата")
    project_id = Column(Integer, ForeignKey("projects.id"), comment="Связь с проектом")
    team_id = Column(Integer, ForeignKey("teams.id"), comment="Связь с командой")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="Время последнего обновления")

    # Отношения
    participants = relationship(
        "User",
        secondary=conversation_participants,
        back_populates="conversations",
        lazy="selectin",  # Оптимизация загрузки
        cascade="save-update, merge"
    )

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Message.timestamp"
    )

    @validates('type')
    def validate_type(self, key, value):
        """Валидация типа чата при создании"""
        if not isinstance(value, ConversationType):
            raise ValueError("Недопустимый тип чата")
        return value


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, comment="Уникальный ID сообщения")
    content = Column(Text, nullable=False, comment="Текст сообщения")
    timestamp = Column(DateTime, default=datetime.now(), index=True, comment="Время отправки")

    # Внешние ключи
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Отношения
    sender = relationship("User", back_populates="messages", lazy="joined")
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.id} from {self.sender_id}>"