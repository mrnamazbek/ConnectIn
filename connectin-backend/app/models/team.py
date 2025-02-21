from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .base import Base
from .associations import user_teams_association

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    members = relationship("User", secondary=user_teams_association, back_populates="teams")
    posts = relationship("Post", back_populates="team", cascade="all, delete")

    def __repr__(self):
        return f"<Team id={self.id} name={self.name}>"
