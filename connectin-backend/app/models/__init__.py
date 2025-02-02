"""
app/models/__init__.py:
Импортируем все модели, чтобы Alembic видел их при автогенерации миграций.
Также ре-экспорт, чтобы было удобно пользоваться в другом коде.
"""

from .base import Base
from .user import User, user_teams_association
from .team import Team
from .project import Project, project_skills_association
from .skill import Skill
from .article import Article, Comment, article_tags_association
from .tag import Tag, project_tags_association
from .request import Request
from .review import Review
from .recommendation import Recommendation

__all__ = [
    "Base",
    "User",
    "Team",
    "Project",
    "Skill",
    "Article",
    "Comment",
    "Tag",
    "Request",
    "Review",
    "Recommendation",
    "user_teams_association",
    "project_skills_association",
    "article_tags_association",
    "project_tags_association",
]
