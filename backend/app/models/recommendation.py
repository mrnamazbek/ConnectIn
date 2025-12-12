# connectin-backend/app/models/recommendation.py (Пример пути)

from sqlalchemy import (Column, Integer, String, Text, Float, DateTime,
                        ForeignKey, CheckConstraint, Index, func)
from sqlalchemy.orm import relationship
from .base import Base # Убедитесь, что импорт Base корректен
# Импортируем User для связи (убедитесь, что путь правильный)
# from .user import User # Если User в отдельном файле
# from .project import Project # Если Project в отдельном файле
# from .team import Team       # Если Team в отдельном файле
# from .post import Post       # Если Post в отдельном файле
# Если все модели в одном файле (как было раньше), эти импорты не нужны

class Recommendation(Base):
    """
    Основная модель для хранения всех типов рекомендаций.
    Содержит ссылки на отправителя (если есть), получателя и рекомендуемый объект.
    """
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)

    # Тип рекомендации (обязательное поле)
    recommendation_type = Column(String(20), nullable=False, index=True) # 'project', 'team', 'post', 'user' и т.д.

    # От кого рекомендация (может быть NULL для системных)
    from_user_id = Column(Integer, ForeignKey("users.id", name="fk_recommendation_from_user", ondelete="SET NULL"), nullable=True, index=True)

    # Кому рекомендация (должно быть всегда)
    to_user_id = Column(
        Integer,
        ForeignKey("users.id", name="fk_recommendation_to_user", ondelete="CASCADE"),
        nullable=False,  # <--- ИЗМЕНЕНО НА False
        index=True
    )
    # Ссылки на рекомендуемые объекты (только одна из них будет заполнена)
    project_id = Column(Integer, ForeignKey("projects.id", name="fk_recommendation_project", ondelete="CASCADE"), nullable=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", name="fk_recommendation_team", ondelete="CASCADE"), nullable=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", name="fk_recommendation_post", ondelete="CASCADE"), nullable=True, index=True)

    # Содержание рекомендации
    text = Column(Text, nullable=True)
    score = Column(Float, nullable=True, index=True) # Индексируем для возможной сортировки

    # Временные метки
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now()) # Рекомендуется добавить

    # --- Ограничения ---
    __table_args__ = (
        # Проверка допустимых типов рекомендаций
        CheckConstraint(
            "recommendation_type IN ('project', 'team', 'post', 'user')", # Добавьте 'user', если планируете
            name="ck_recommendation_type"
        ),
        # Проверка, что заполнена только одна из ссылок на объект
        CheckConstraint(
            "(CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END + "
            "CASE WHEN team_id IS NOT NULL THEN 1 ELSE 0 END + "
            "CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_recommendation_target_single"
        ),
        # Уникальный индекс, чтобы избежать дублирования одинаковых рекомендаций
        # (одному и тому же пользователю тот же проект/команду/пост)
        Index('uq_recommendation_target',
              'recommendation_type', 'to_user_id', 'project_id', 'team_id', 'post_id',
              unique=True),
    )

    # --- Связи SQLAlchemy (Relationships) ---
    # Настройте back_populates в соответствующих моделях (User, Project, Team, Post)
    from_user = relationship("User", foreign_keys=[from_user_id], back_populates="sent_recommendations") # Нужна связь в User
    to_user = relationship("User", foreign_keys=[to_user_id], back_populates="received_recommendations") # Нужна связь в User

    project = relationship("Project") # Связь с Project (back_populates='recommendations' в Project)
    team = relationship("Team")       # Связь с Team (back_populates='recommendations' в Team)
    post = relationship("Post")         # Связь с Post (back_populates='recommendations' в Post)

    def __repr__(self):
        target_id = self.project_id or self.team_id or self.post_id
        return (f"<Recommendation id={self.id} type={self.recommendation_type} "
                f"to_user={self.to_user_id} target_id={target_id} score={self.score:.2f}>")

# --- МОДЕЛИ ProjectRecommendation, TeamRecommendation, PostRecommendation НУЖНО УДАЛИТЬ ---
# class ProjectRecommendation(Base): ... (УДАЛИТЬ)
# class TeamRecommendation(Base): ... (УДАЛИТЬ)
# class PostRecommendation(Base): ... (УДАЛИТЬ)