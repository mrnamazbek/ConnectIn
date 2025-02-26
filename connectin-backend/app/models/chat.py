from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
from .base import Base
from .associations import conversation_participants


# Определяем типы чатов с помощью встроенного Enum из Python.
class ConversationType(PyEnum):
    direct = "direct"  # 🔹 Чат один на один (direct)
    project = "project"  # 🔹 Групповой чат для проекта
    team = "team"  # 🔹 Групповой чат для команды


# Класс Conversation описывает сущность "Разговор" (чат)
class Conversation(Base):
    __tablename__ = "conversations"

    # Уникальный идентификатор разговора
    id = Column(Integer, primary_key=True, index=True)

    # Тип разговора, используя наш Python Enum. Это может быть direct, project или team.
    type = Column(Enum(ConversationType), nullable=False)

    # Идентификатор проекта (если чат связан с проектом), может быть NULL.
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)

    # Идентификатор команды (если чат связан с командой), может быть NULL.
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    # Связь с участниками разговора.
    # Используется вспомогательная таблица (association table) conversation_participants для связи многие-ко-многим.
    participants = relationship("User", secondary=conversation_participants, back_populates="conversations")

    # Связь с сообщениями в разговоре.
    # При удалении разговора все связанные сообщения будут удалены благодаря cascade="all, delete".
    messages = relationship("Message", back_populates="conversation", cascade="all, delete")


# Класс Message описывает сущность "Сообщение"
class Message(Base):
    __tablename__ = "messages"

    # Уникальный идентификатор сообщения
    id = Column(Integer, primary_key=True, index=True)

    # Идентификатор разговора, к которому принадлежит сообщение
    conversation_id = Column(Integer, ForeignKey("conversations.id"))

    # Идентификатор отправителя сообщения
    sender_id = Column(Integer, ForeignKey("users.id"))

    # Содержимое сообщения
    content = Column(Text, nullable=False)

    # Время создания сообщения. По умолчанию устанавливается текущее время.
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Связь с пользователем, который отправил сообщение.
    sender = relationship("User", back_populates="messages")

    # Связь с разговором, к которому относится сообщение.
    conversation = relationship("Conversation", back_populates="messages")
