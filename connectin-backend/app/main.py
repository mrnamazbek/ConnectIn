from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import todos, auth, chat_ws, projects, skills, teams, posts, users, tags, chats
from app.core import settings
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.v1 import resume as resumes_v1 # Импортируем роутер резюме



def create_app() -> FastAPI:
    app = FastAPI(
        title="ConnectIn API",
        version="1.0.0",
        description="Collaborative platform for efficient team formation"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "https://frontend-production-1eef2.up.railway.app"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Добавляем SessionMiddleware (обязательно для OAuth)
    app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

    # Настройка slowapi для ограничения скорости запросов
    limiter = Limiter(key_func=get_remote_address)
    # app.state — это атрибут FastAPI, используемый для хранения данных (не папка)
    app.state.limiter = limiter

    # Пример глобального middleware для slowapi (добавляет заголовки лимита)
    @app.middleware("http")
    async def add_rate_limit_headers(request, call_next):
        response = await call_next(request)
        # Можно добавить реальные значения из limiter, например:
        response.headers["X-RateLimit-Remaining"] = "some_value"
        return response

    # Подключаем маршруты
    app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
    app.include_router(projects.router, prefix="/projects", tags=["Projects"])
    app.include_router(teams.router, prefix="/teams", tags=["Teams"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(posts.router, prefix="/posts", tags=["Posts"])
    app.include_router(tags.router, prefix="/tags", tags=["Tags"])
    app.include_router(skills.router, prefix="/skills", tags=["Skills"])
    app.include_router(todos.router, prefix="/todos", tags=["Todos"])
    app.include_router(chats.router, prefix="/chats", tags=["Chats"])
    app.include_router(chat_ws.router, prefix="/chats/ws", tags=["Chat WebSocket"])
    app.include_router(resumes_v1.router, prefix="/resume", tags=["Resume Generator"])

    return app

app = create_app()
