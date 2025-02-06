from fastapi import FastAPI
from app.api import auth, projects, teams, users, posts, tags
from fastapi.middleware.cors import CORSMiddleware

def create_app() -> FastAPI:
    """
    Создаёт и настраивает экземпляр FastAPI.
    """
    app = FastAPI(
        title="Connecto API",
        version="1.0.0",
        description="Портал для взаимодействия профессиональных команд и владельцев проектов"
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow requests from your frontend
        allow_credentials=True,  # Allow cookies/auth headers
        allow_methods=["*"],  # Allow all HTTP methods
        allow_headers=["*"],  # Allow all headers
    )

    app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    app.include_router(projects.router, prefix="/projects", tags=["Projects"])
    app.include_router(teams.router, prefix="/teams", tags=["Teams"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(posts.router, prefix="/posts", tags=["Posts"])
    app.include_router(tags.router, prefix="/tags", tags=["Tags"])


    return app

app = create_app()
