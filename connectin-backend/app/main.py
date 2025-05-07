from fastapi import FastAPI, APIRouter
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import todos, auth, chat_ws, projects, skills, teams, posts, users, tags, recommendations
from app.api.v1 import chats # Импортируем новые модули для чата и загрузок
from app.api.v1 import notifications # Import notifications router
from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.v1 import resume as resumes_v1
from app.api.v1 import graph as graph_v1 # Импорт нового роутера



def create_app() -> FastAPI:
    app = FastAPI(
        title="ConnectIn API",
        version="1.1.0",
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

    # Create main API router with /api/v1 prefix
    api_router = APIRouter(prefix="/api/v1")

    # Include all routers in the main API router
    api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
    api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
    api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])
    api_router.include_router(users.router, prefix="/users", tags=["Users"])
    api_router.include_router(posts.router, prefix="/posts", tags=["Posts"])
    api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
    api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
    api_router.include_router(todos.router, prefix="/todos", tags=["Todos"])
    api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
    api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

    # Подключаем новые маршруты для чатов и загрузки файлов
    api_router.include_router(chats.router, prefix="/chats", tags=["Chat"])  # REST API для чатов
    api_router.include_router(chat_ws.router, prefix="/chat/ws", tags=["Chat WebSocket"])  # WebSockets для чата
    # api_router.include_router(chat_uploads.router, prefix="/uploads", tags=["Uploads"])  # Маршруты для загрузки файлов

    api_router.include_router(resumes_v1.router, prefix="/resume", tags=["Resume Generator"])
    
    # Add graph router with proper prefix
    api_router.include_router(graph_v1.router, prefix="/graph", tags=["Graph"])  # Added to api_router

    # Include the main API router in the app
    app.include_router(api_router)

    return app


app = create_app()