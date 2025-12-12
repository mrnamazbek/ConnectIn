"""
app/schemas/__init__.py
Собираем все Pydantic-схемы в одном месте.
"""

from .user import UserCreate, UserUpdate, UserOut
from .team import TeamCreate, TeamUpdate, TeamOut
from .project import ProjectCreate, ProjectUpdate, ProjectOut
# ... Если есть и другие (article, skill, etc.), добавьте:
# from .article import ArticleCreate, ArticleUpdate, ArticleOut, CommentCreate, ...

__all__ = [
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "TeamCreate",
    "TeamUpdate",
    "TeamOut",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectOut",
]
