"""
Project Service models
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.sql import func
from app.database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    
    # Technical details
    tech_stack = Column(ARRAY(String), default=[])
    required_roles = Column(ARRAY(String), default=[])
    difficulty_level = Column(String, default="intermediate")
    
    # Status
    status = Column(String, default="open")  # open, in_progress, completed, archived
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deadline = Column(DateTime(timezone=True), nullable=True)

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, accepted, rejected
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
