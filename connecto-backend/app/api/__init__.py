"""
app/api/__init__.py:
Собираем все роутеры (endpoints) в одном месте.
"""

from .auth import router as auth_router
from .projects import router as projects_router
from .teams import router as teams_router
from .users import router as users_router

# Можно также определить функцию init_routers(app)
# для удобного подключения в main.py:
#
# def init_routers(app: FastAPI):
#     app.include_router(auth_router, prefix="/auth", tags=["Auth"])
#     app.include_router(projects_router, prefix="/projects", tags=["Projects"])
#     ...
#
# Тогда в main.py:
# from app.api import init_routers
# init_routers(app)
