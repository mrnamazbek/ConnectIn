from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import Base

# Many-to-Many: Post ↔ Skills (for team posts)
post_skills_association = Table(
    "post_skills",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True),
    extend_existing=True  # ✅ Prevents duplicate declaration errors
)

# Many-to-Many: Post ↔ Tags (for project posts)
post_tags_association = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    extend_existing=True
)

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String, nullable=False)  # "news", "project", "team"
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be NULL for team posts
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    author = relationship("User", back_populates="posts")
    project = relationship("Project", back_populates="posts")
    team = relationship("Team", back_populates="posts")

    skills = relationship("Skill", secondary=post_skills_association, back_populates="posts")
    tags = relationship("Tag", secondary=post_tags_association, back_populates="posts")

    def __repr__(self):
        return f"<Post id={self.id} title={self.title} type={self.post_type}>"
