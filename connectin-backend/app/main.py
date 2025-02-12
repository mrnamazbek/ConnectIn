from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from app.api import auth, projects, teams, users, posts, tags, todos
from app.core import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="ConnectIn API",
        version="1.0.0",
        description="Платформа для взаимодействия профессионалов"
    )

    # Добавляем SessionMiddleware (обязателен для OAuth)
    app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

    # Подключаем маршруты
    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(projects.router, prefix="/projects", tags=["Projects"])
    app.include_router(teams.router, prefix="/teams", tags=["Teams"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(posts.router, prefix="/posts", tags=["Posts"])
    app.include_router(tags.router, prefix="/tags", tags=["Tags"])
    app.include_router(todos.router, prefix="/todos", tags=["Todos"])

    return app

app = create_app()
