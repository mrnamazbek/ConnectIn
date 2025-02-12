from fastapi.testclient import TestClient
from starlette.responses import RedirectResponse

from app.main import app
from app.database.connection import SessionLocal
import pytest

client = TestClient(app)


def test_google_oauth_flow(mocker):
    # Мокаем Google OAuth
    mock_oauth = mocker.patch("app.utils.auth.oauth.google")
    mock_oauth.authorize_redirect.return_value = RedirectResponse(url="dummy_url")
    mock_oauth.authorize_access_token.return_value = {"userinfo": {"email": "test@google.com"}}

    # 1. Проверка редиректа на Google
    response = client.get("/api/auth/google/login")
    assert response.status_code == 307  # Редирект

    # 2. Мокаем callback
    response = client.get("/api/auth/google/callback?code=dummy_code")
    assert response.status_code == 200
    assert "access_token" in response.json()

    # 3. Проверяем, что пользователь создан в БД
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test@google.com").first()
    assert user is not None
    assert user.google_id is not None
