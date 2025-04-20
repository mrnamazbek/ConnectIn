# Импорт всех роутеров для автоматической регистрации
from fastapi import APIRouter
from .auth import router as auth_router
from .projects import router as projects_router
from .teams import router as teams_router
from .users import router as users_router
from .posts import router as posts_router
from .tags import router as tags_router
from .skills import router as skills_router
from .todos import router as todos_router
from .chats import router as chats_router
from .chat_ws import router as chat_ws_router

# Автоматическая регистрация при импорте *
__all__ = [
    "auth_router",
    "projects_router",
    "teams_router",
    "users_router",
    "posts_router",
    "tags_router",
    "skills_router",
    "todos_router",
    "chats_router",
    "chat_ws_router"
]

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(posts_router, prefix="/posts", tags=["Posts"])
router.include_router(projects_router, prefix="/projects", tags=["Projects"])
router.include_router(todos_router, prefix="/todos", tags=["To-Do"])
router.include_router(teams_router, prefix="/teams", tags=["Teams"])
router.include_router(skills_router, prefix="/skills", tags=["Skills"])
router.include_router(chats_router, prefix="/chats", tags=["Chats"])
router.include_router(chat_ws_router, prefix="/ws/chats", tags=["WebSockets"])