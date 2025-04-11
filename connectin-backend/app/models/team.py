from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from .relations.associations import user_teams_association

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # From your migration

    leader = relationship("User", backref="led_teams")  # Relationship to the leader
    members = relationship("User", secondary=user_teams_association, back_populates="teams")
    posts = relationship("Post", back_populates="team", cascade="all, delete")

    team_recommendations = relationship("TeamRecommendation", back_populates="team")

    def __repr__(self):
        return f"<Team id={self.id} name={self.name}>"