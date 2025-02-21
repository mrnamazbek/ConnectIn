from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum
from .base import Base
from .associations import conversation_participants

class ConversationType(PyEnum):
    direct = "direct"   # 🔹 One-to-One Chat
    project = "project" # 🔹 Project Group Chat
    team = "team"       # 🔹 Team Group Chat

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ConversationType), nullable=False)  # 🔹 Direct, Project, or Team
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # 🔹 Optional: If a project chat
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)  # 🔹 Optional: If a team chat

    participants = relationship("User", secondary=conversation_participants, back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", back_populates="messages")
    conversation = relationship("Conversation", back_populates="messages")
