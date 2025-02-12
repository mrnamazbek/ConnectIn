from tests.test_auth import client


def test_user_registration():
    # Пытаемся зарегистрировать нового пользователя
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

    # Пытаемся зарегистрироваться с тем же email (должна быть ошибка)
    response = client.post("/auth/register", json={
        "username": "testuser2",
        "email": "test@example.com",
        "password": "anotherpassword"
    })
    assert response.status_code == 400