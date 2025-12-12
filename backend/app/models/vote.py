from sqlalchemy import Column, Integer, ForeignKey, Boolean, UniqueConstraint
from .base import Base

class ProjectVote(Base):
    __tablename__ = "project_votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    is_upvote = Column(Boolean, nullable=False)  # ✅ True for Upvote, False for Downvote

    __table_args__ = (UniqueConstraint("user_id", "project_id", name="unique_project_vote"),)