"""
app/api/__init__.py:
Собираем все роутеры (endpoints) в одном месте.
"""

from app.api.v1.todos import router as todos_router

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