from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.relations.associations import conversation_participants
import enum

class ConversationType(str, enum.Enum):
    DIRECT = "direct"
    # Future types can be added here:
    # PROJECT = "project"
    # TEAM = "team"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, default=ConversationType.DIRECT.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participants = relationship(
        "User",
        secondary=conversation_participants,
        back_populates="conversations",
        lazy="selectin"
    )
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Message.timestamp.desc()"
    )

    @property
    def last_message(self):
        """Return the most recent message in this conversation"""
        return self.messages[0] if self.messages else None
        
    @property
    def other_participants(self, current_user_id):
        """Get participants other than the current user"""
        return [p for p in self.participants if p.id != current_user_id]

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    read = Column(DateTime, nullable=True)  # When the message was read
    
    # Media fields
    media_url = Column(String, nullable=True)  # URL or path to the media file
    media_type = Column(String, nullable=True)  # Type of media (image, video, etc.)
    media_name = Column(String, nullable=True)  # Original filename of the media
    
    # Foreign keys
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages", lazy="joined") 