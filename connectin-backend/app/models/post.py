from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base
from .relations.associations import post_tags_association

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String, nullable=False)  # "news", "project", "team"
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    author = relationship("User", back_populates="posts")
    project = relationship("Project", back_populates="posts")
    team = relationship("Team", back_populates="posts")
    
    tags = relationship("Tag", secondary=post_tags_association, back_populates="posts")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")  # 🔹 Corrected reference
    saved_by = relationship("SavedPost", back_populates="post", cascade="all, delete-orphan")
    post_recommendations = relationship("PostRecommendation", back_populates="post")

    def __repr__(self):
        return f"<Post id={self.id} title={self.title} type={self.post_type}>"
