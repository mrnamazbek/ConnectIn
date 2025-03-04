from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
# Обновленный импорт для v1:
from app.api.v1.websocket import chat_ws_routes
from app.api.v1 import (
    auth_router,
    chat_router,
    project_router,
    team_routes,
    user_routes,
    post_router,
    tag_routes,
    skill_routes,
    todo_routes
)
from app.core import settings
from slowapi import Limiter
from slowapi.util import get_remote_address


def create_app() -> FastAPI:
    app = FastAPI(
        title="ConnectIn API",
        version="1.1.0",
        description="Collaborative platform for efficient team formation"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
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
    app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
    app.include_router(project_router.router, prefix="/projects", tags=["Projects"])
    app.include_router(team_routes.router, prefix="/teams", tags=["Teams"])
    app.include_router(user_routes.router, prefix="/users", tags=["Users"])
    app.include_router(post_router.router, prefix="/posts", tags=["Posts"])
    app.include_router(tag_routes.router, prefix="/tags", tags=["Tags"])
    app.include_router(skill_routes.router, prefix="/skills", tags=["Skills"])
    app.include_router(todo_routes.router, prefix="/todos", tags=["Todos"])
    app.include_router(chat_router.router, prefix="/chats", tags=["Chats"])
    app.include_router(chat_ws_routes.router, prefix="/chats/ws", tags=["Chat WebSocket"])

    return app

app = create_app()
