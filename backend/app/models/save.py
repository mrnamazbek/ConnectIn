from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class SavedPost(Base): 
    __tablename__ = "saved_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    post = relationship("Post", back_populates="saved_by")
    user = relationship("User", back_populates="saved_posts")

    __table_args__ = (UniqueConstraint("user_id", "post_id", name="unique_post_save"),)