from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .relations.associations import project_tags_association, post_tags_association, todo_tags_association

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

    # Добавляем связь с Todo
    todos = relationship(
        "Todo",
        secondary=todo_tags_association,
        back_populates="tags"
    )

    def __repr__(self):
        return f"<Tag id={self.id} name={self.name}>"
