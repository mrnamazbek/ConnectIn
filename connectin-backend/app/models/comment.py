from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base

class PostComment(Base):  
    __tablename__ = "post_comments"  

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)  
    created_at = Column(DateTime, default=func.now())

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="comments")  
    post = relationship("Post", back_populates="comments")  
    
class ProjectComment(Base):
    __tablename__ = "project_comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="project_comments")  # ✅ Fix backref name
    project = relationship("Project", back_populates="comments")

