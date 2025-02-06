from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

# Many-to-Many between Tags and Projects
project_tags_association = Table(
    "project_tags",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    extend_existing=True
)

# ✅ Many-to-Many between Tags and Posts (for project posts)
post_tags_association = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
    extend_existing=True
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # ✅ Many-to-Many: Tags & Projects
    projects = relationship(
        "Project",
        secondary=project_tags_association,
        back_populates="tags"
    )

    # ✅ Many-to-Many: Tags & Posts (for project posts)
    posts = relationship(
        "Post",
        secondary=post_tags_association,
        back_populates="tags"
    )

    def __repr__(self):
        return f"<Tag id={self.id} name={self.name}>"
