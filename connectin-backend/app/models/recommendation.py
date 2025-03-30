from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from .base import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    recommendation_type = Column(String(20), nullable=False)

    __table_args__ = (
        CheckConstraint("recommendation_type IN ('project', 'team', 'post')", name="ck_recommendation_type"),
    )

    # Отношение к пользователю, который создал рекомендацию
    from_user = relationship("User", back_populates="recommendations")

    # Одно к одному с подтаблицами рекомендаций
    project_recommendation = relationship("ProjectRecommendation", uselist=False, back_populates="recommendation")
    team_recommendation = relationship("TeamRecommendation", uselist=False, back_populates="recommendation")
    post_recommendation = relationship("PostRecommendation", uselist=False, back_populates="recommendation")

    def __repr__(self):
        return f"<Recommendation id={self.id} type={self.recommendation_type} from_user_id={self.from_user_id}>"

class ProjectRecommendation(Base):
    __tablename__ = "project_recommendations"

    recommendation_id = Column(Integer, ForeignKey("recommendations.id", ondelete="CASCADE"), primary_key=True)
    to_project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    recommendation = relationship("Recommendation", back_populates="project_recommendation")
    project = relationship("Project", back_populates="project_recommendations")

    def __repr__(self):
        return f"<ProjectRecommendation recommendation_id={self.recommendation_id} to_project_id={self.to_project_id}>"

class TeamRecommendation(Base):
    __tablename__ = "team_recommendations"

    recommendation_id = Column(Integer, ForeignKey("recommendations.id", ondelete="CASCADE"), primary_key=True)
    to_team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)

    recommendation = relationship("Recommendation", back_populates="team_recommendation")
    team = relationship("Team", back_populates="team_recommendations")

    def __repr__(self):
        return f"<TeamRecommendation recommendation_id={self.recommendation_id} to_team_id={self.to_team_id}>"

class PostRecommendation(Base):
    __tablename__ = "post_recommendations"

    recommendation_id = Column(Integer, ForeignKey("recommendations.id", ondelete="CASCADE"), primary_key=True)
    to_post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    recommendation = relationship("Recommendation", back_populates="post_recommendation")
    post = relationship("Post", back_populates="post_recommendations")

    def __repr__(self):
        return f"<PostRecommendation recommendation_id={self.recommendation_id} to_post_id={self.to_post_id}>"
