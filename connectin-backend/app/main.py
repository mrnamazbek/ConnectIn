from fastapi import FastAPI, APIRouter, Request, Depends, HTTPException, status
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
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.auth import handle_google_callback, handle_github_callback, oauth
from app.models.user import User
import logging

# Configure logging
logger = logging.getLogger(__name__)


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

    # OAuth callback handlers at root level to match OAuth provider settings
    @app.get("/auth/google/callback")
    async def root_google_callback(request: Request, db: Session = Depends(get_db)):
        """Root level handler for Google OAuth callback"""
        try:
            logger.info("Received Google OAuth callback at root level")
            # Process the OAuth callback
            user_info = await handle_google_callback(request)
            if not user_info:
                logger.error("Failed to get user info from Google")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed", 
                    status_code=status.HTTP_302_FOUND
                )

            email = user_info.get("email")
            if not email:
                logger.error("Email not obtained from Google")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/login?error=email_missing", 
                    status_code=status.HTTP_302_FOUND
                )
                
            # Find or create user
            google_id = user_info.get("sub")
            user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()

            if user:
                logger.info(f"Found existing user: {user.email}")
                if not user.google_id and google_id:
                    user.google_id = google_id
                    db.commit()
                    logger.info(f"Updated Google ID for user: {user.email}")
            else:
                # Import necessary functions
                from app.api.v1.auth import generate_unique_username, create_access_token, create_refresh_token, set_auth_cookies
                # Create new user
                base_username = user_info.get("name", "").replace(" ", "_").lower() or email.split("@")[0]
                username = generate_unique_username(base_username, db)
                user = User(
                    email=email,
                    username=username,
                    hashed_password="",
                    google_id=google_id,
                    first_name=user_info.get("given_name"),
                    last_name=user_info.get("family_name"),
                    avatar_url=user_info.get("picture")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Created new Google user: {user.email}")

            # Generate tokens
            from app.api.v1.auth import create_access_token, create_refresh_token, set_auth_cookies
            access_token = create_access_token(user)
            refresh_token = create_refresh_token(user)
            
            # Redirect to frontend with tokens in URL (fallback approach)
            logger.info(f"Redirecting to frontend after successful Google authentication")
            redirect_url = f"{settings.FRONTEND_URL}/login?auth_success=true&access_token={access_token}&refresh_token={refresh_token}"
            
            # Create response and set cookies as well
            response = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
            
            # Set cookies with tokens (standard approach)
            response = set_auth_cookies(response, access_token, refresh_token)
            return response
            
        except Exception as e:
            logger.error(f"Error processing Google callback: {e}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=google_callback_error", 
                status_code=status.HTTP_302_FOUND
            )
        
    @app.get("/auth/github/callback")
    async def root_github_callback(request: Request, db: Session = Depends(get_db)):
        """Root level handler for GitHub OAuth callback"""
        try:
            # Get token from GitHub
            token = await oauth.github.authorize_access_token(request)
            if not token:
                return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=github_token_failed", status_code=status.HTTP_302_FOUND)
                
            # Get user data
            from app.utils.auth import get_github_user_info
            user_data = await get_github_user_info(token)
            if not user_data:
                return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=github_user_data_failed", status_code=status.HTTP_302_FOUND)

            email = user_data.get("email")
            if not email:
                return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=email_missing", status_code=status.HTTP_302_FOUND)
                
            github_url = user_data.get("html_url")
            github_id = str(user_data.get("id", ""))
            username_github = user_data.get("login", "")
                
            # Find existing user
            user = db.query(User).filter(
                (User.email == email) | 
                (User.github == github_url) | 
                (User.username == username_github)
            ).first()

            if user:
                # Update GitHub information if missing
                if not user.github and github_url:
                    user.github = github_url
                    db.commit()
            else:
                # Create new user
                from app.api.v1.auth import generate_unique_username
                base_username = username_github or email.split("@")[0]
                username = generate_unique_username(base_username, db)
                user = User(
                    email=email,
                    username=username,
                    hashed_password="",
                    github=github_url,
                    avatar_url=user_data.get("avatar_url", ""),
                    name=user_data.get("name", "")
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Generate tokens
            from app.api.v1.auth import create_access_token, create_refresh_token, set_auth_cookies
            access_token = create_access_token(user)
            refresh_token = create_refresh_token(user)
            
            # Redirect to frontend
            redirect_url = f"{settings.FRONTEND_URL}/login?auth_success=true"
            response = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
            
            # Set cookies with tokens
            response = set_auth_cookies(response, access_token, refresh_token)
            return response
            
        except Exception as e:
            logger.error(f"Error processing GitHub callback: {e}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=github_callback_error", status_code=status.HTTP_302_FOUND)

    return app


app = create_app()