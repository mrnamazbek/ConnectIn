# app/main.py

from fastapi import FastAPI
from app.api import auth, projects, teams, users

def create_app() -> FastAPI:
    """
    Создаёт и настраивает экземпляр FastAPI.
    """
    app = FastAPI(
        title="Connecto API",
        version="1.0.0",
        description="Портал для взаимодействия профессиональных команд и владельцев проектов"
    )

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(projects.router, prefix="/projects", tags=["Projects"])
    app.include_router(teams.router, prefix="/teams", tags=["Teams"])
    app.include_router(users.router, prefix="/users", tags=["Users"])

    return app

app = create_app()
