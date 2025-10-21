# REST API - Руководство для собеседования

## 🌐 Основы REST API

### Что такое REST?
REST (Representational State Transfer) - это архитектурный стиль для проектирования веб-сервисов. REST использует HTTP протокол для взаимодействия между клиентом и сервером.

### Принципы REST
1. **Stateless** - каждый запрос содержит всю необходимую информацию
2. **Client-Server** - разделение клиента и сервера
3. **Cacheable** - ответы могут быть кешированы
4. **Uniform Interface** - единообразный интерфейс
5. **Layered System** - многоуровневая архитектура

## 📡 HTTP методы

### Основные HTTP методы
```python
# GET - получение данных
GET /api/users          # Получить всех пользователей
GET /api/users/123      # Получить пользователя с ID 123

# POST - создание нового ресурса
POST /api/users         # Создать нового пользователя
{
    "name": "John Doe",
    "email": "john@example.com"
}

# PUT - полное обновление ресурса
PUT /api/users/123      # Полностью обновить пользователя 123
{
    "name": "John Smith",
    "email": "johnsmith@example.com"
}

# PATCH - частичное обновление ресурса
PATCH /api/users/123    # Частично обновить пользователя 123
{
    "email": "newemail@example.com"
}

# DELETE - удаление ресурса
DELETE /api/users/123   # Удалить пользователя 123
```

### Примеры использования в FastAPI
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Модели данных
class User(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    age: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None

# Хранилище данных (в реальном приложении - база данных)
users_db = []
next_id = 1

# GET - получение всех пользователей
@app.get("/api/users", response_model=List[User])
async def get_users():
    return users_db

# GET - получение пользователя по ID
@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# POST - создание нового пользователя
@app.post("/api/users", response_model=User, status_code=201)
async def create_user(user: User):
    global next_id
    user.id = next_id
    next_id += 1
    users_db.append(user)
    return user

# PUT - полное обновление пользователя
@app.put("/api/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: User):
    user_index = next((i for i, u in enumerate(users_db) if u.id == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.id = user_id
    users_db[user_index] = user
    return user

# PATCH - частичное обновление пользователя
@app.patch("/api/users/{user_id}", response_model=User)
async def patch_user(user_id: int, user_update: UserUpdate):
    user_index = next((i for i, u in enumerate(users_db) if u.id == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_index]
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    return user

# DELETE - удаление пользователя
@app.delete("/api/users/{user_id}", status_code=204)
async def delete_user(user_id: int):
    user_index = next((i for i, u in enumerate(users_db) if u.id == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    users_db.pop(user_index)
    return None
```

## 📊 HTTP статус-коды

### Основные статус-коды
```python
# 2xx - Успешные запросы
200 OK              # Запрос выполнен успешно
201 Created         # Ресурс создан
202 Accepted        # Запрос принят к обработке
204 No Content      # Запрос выполнен, но нет содержимого

# 3xx - Перенаправления
301 Moved Permanently   # Ресурс перемещен навсегда
302 Found              # Ресурс временно перемещен
304 Not Modified       # Ресурс не изменился

# 4xx - Ошибки клиента
400 Bad Request        # Неверный запрос
401 Unauthorized       # Не авторизован
403 Forbidden          # Доступ запрещен
404 Not Found          # Ресурс не найден
409 Conflict           # Конфликт (например, дублирование)
422 Unprocessable Entity # Неверные данные
429 Too Many Requests  # Слишком много запросов

# 5xx - Ошибки сервера
500 Internal Server Error # Внутренняя ошибка сервера
502 Bad Gateway          # Ошибка шлюза
503 Service Unavailable  # Сервис недоступен
504 Gateway Timeout      # Таймаут шлюза
```

### Использование статус-кодов в FastAPI
```python
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    if user_id < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID must be positive"
        )
    
    user = find_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: User):
    if user_exists(user.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    return create_user_in_db(user)

# Кастомные ответы
@app.get("/api/custom-response")
async def custom_response():
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": "Request accepted for processing"}
    )
```

## 🔄 Idempotency (Идемпотентность)

### Что такое идемпотентность?
Идемпотентная операция - это операция, которая при многократном выполнении дает тот же результат, что и при однократном выполнении.

### Идемпотентные HTTP методы
```python
# GET - всегда идемпотентен
GET /api/users/123  # Многократные вызовы дают тот же результат

# PUT - идемпотентен (полная замена ресурса)
PUT /api/users/123
{
    "name": "John Doe",
    "email": "john@example.com"
}
# Повторные вызовы с теми же данными дают тот же результат

# DELETE - идемпотентен
DELETE /api/users/123  # После первого удаления, повторные вызовы не изменяют состояние

# POST - НЕ идемпотентен (создает новый ресурс)
POST /api/users
{
    "name": "John Doe",
    "email": "john@example.com"
}
# Каждый вызов создает нового пользователя
```

### Реализация идемпотентности
```python
import uuid
from typing import Dict, Optional

class IdempotencyManager:
    def __init__(self):
        self.processed_requests: Dict[str, dict] = {}
    
    def generate_idempotency_key(self) -> str:
        """Генерация ключа идемпотентности"""
        return str(uuid.uuid4())
    
    def is_request_processed(self, key: str) -> bool:
        """Проверка, был ли запрос уже обработан"""
        return key in self.processed_requests
    
    def store_request_result(self, key: str, result: dict):
        """Сохранение результата запроса"""
        self.processed_requests[key] = result
    
    def get_request_result(self, key: str) -> Optional[dict]:
        """Получение результата ранее обработанного запроса"""
        return self.processed_requests.get(key)

# Использование в FastAPI
idempotency_manager = IdempotencyManager()

@app.post("/api/users")
async def create_user_with_idempotency(
    user: User,
    idempotency_key: Optional[str] = None
):
    # Если ключ не предоставлен, генерируем новый
    if not idempotency_key:
        idempotency_key = idempotency_manager.generate_idempotency_key()
    
    # Проверяем, был ли запрос уже обработан
    if idempotency_manager.is_request_processed(idempotency_key):
        return idempotency_manager.get_request_result(idempotency_key)
    
    # Обрабатываем запрос
    try:
        result = create_user_in_db(user)
        
        # Сохраняем результат
        idempotency_manager.store_request_result(idempotency_key, result)
        
        return result
    except Exception as e:
        # В случае ошибки не сохраняем результат
        raise HTTPException(status_code=500, detail=str(e))
```

## 🔐 Аутентификация и авторизация

### API ключи
```python
from fastapi import FastAPI, HTTPException, Depends, Header
from typing import Optional

app = FastAPI()

# Простая проверка API ключа
API_KEYS = {"secret-key-123": "admin", "user-key-456": "user"}

def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if not x_api_key or x_api_key not in API_KEYS:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    return API_KEYS[x_api_key]

@app.get("/api/protected")
async def protected_endpoint(user_role: str = Depends(verify_api_key)):
    return {"message": f"Access granted for role: {user_role}"}
```

### Bearer токены
```python
from fastapi import FastAPI, HTTPException, Depends, Header
from typing import Optional

app = FastAPI()

# Простая проверка Bearer токена
VALID_TOKENS = {
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9": "user123",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ8": "admin456"
}

def verify_bearer_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    if token not in VALID_TOKENS:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    
    return VALID_TOKENS[token]

@app.get("/api/user-data")
async def get_user_data(user_id: str = Depends(verify_bearer_token)):
    return {"user_id": user_id, "data": "sensitive user data"}
```

## 📝 Версионирование API

### URL версионирование
```python
from fastapi import FastAPI, APIRouter

app = FastAPI()

# API v1
v1_router = APIRouter(prefix="/api/v1")

@v1_router.get("/users")
async def get_users_v1():
    return {"version": "v1", "users": []}

@v1_router.post("/users")
async def create_user_v1(user: User):
    return {"version": "v1", "user": user}

# API v2
v2_router = APIRouter(prefix="/api/v2")

@v2_router.get("/users")
async def get_users_v2():
    return {"version": "v2", "users": [], "metadata": {"total": 0}}

@v2_router.post("/users")
async def create_user_v2(user: User):
    return {"version": "v2", "user": user, "created_at": "2024-01-01"}

# Подключение роутеров
app.include_router(v1_router)
app.include_router(v2_router)
```

### Header версионирование
```python
from fastapi import FastAPI, Header, HTTPException
from typing import Optional

app = FastAPI()

def get_api_version(api_version: Optional[str] = Header(None, alias="API-Version")):
    if not api_version:
        api_version = "v1"  # Версия по умолчанию
    
    if api_version not in ["v1", "v2"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported API version"
        )
    
    return api_version

@app.get("/api/users")
async def get_users(version: str = Depends(get_api_version)):
    if version == "v1":
        return {"version": "v1", "users": []}
    elif version == "v2":
        return {"version": "v2", "users": [], "metadata": {"total": 0}}
```

## 🎯 Вопросы для собеседования

### 1. Что такое REST и его основные принципы?
**Ответ:** REST - архитектурный стиль для веб-сервисов. Основные принципы: stateless, client-server, cacheable, uniform interface, layered system.

### 2. В чем разница между PUT и PATCH?
**Ответ:** PUT полностью заменяет ресурс, PATCH частично обновляет ресурс. PUT идемпотентен, PATCH может быть не идемпотентным.

### 3. Что такое идемпотентность?
**Ответ:** Идемпотентная операция при многократном выполнении дает тот же результат. GET, PUT, DELETE идемпотентны, POST - нет.

### 4. Какие HTTP статус-коды вы знаете?
**Ответ:** 2xx (успех), 3xx (перенаправление), 4xx (ошибка клиента), 5xx (ошибка сервера). Основные: 200, 201, 400, 401, 403, 404, 500.

### 5. Как обеспечить безопасность REST API?
**Ответ:** Использовать HTTPS, аутентификацию (JWT, API ключи), авторизацию, валидацию входных данных, rate limiting, CORS.

## 💡 Практические задачи

### Задача 1: REST API для блога
```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI()

class Post(BaseModel):
    id: Optional[int] = None
    title: str
    content: str
    author: str
    created_at: Optional[datetime] = None
    published: bool = False

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    published: Optional[bool] = None

# Хранилище данных
posts_db = []
next_id = 1

@app.get("/api/posts", response_model=List[Post])
async def get_posts(published_only: bool = False):
    """Получить все посты"""
    if published_only:
        return [post for post in posts_db if post.published]
    return posts_db

@app.get("/api/posts/{post_id}", response_model=Post)
async def get_post(post_id: int):
    """Получить пост по ID"""
    post = next((p for p in posts_db if p.id == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.post("/api/posts", response_model=Post, status_code=201)
async def create_post(post: Post):
    """Создать новый пост"""
    global next_id
    post.id = next_id
    next_id += 1
    post.created_at = datetime.now()
    posts_db.append(post)
    return post

@app.put("/api/posts/{post_id}", response_model=Post)
async def update_post(post_id: int, post: Post):
    """Полностью обновить пост"""
    post_index = next((i for i, p in enumerate(posts_db) if p.id == post_id), None)
    if post_index is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.id = post_id
    post.created_at = posts_db[post_index].created_at
    posts_db[post_index] = post
    return post

@app.patch("/api/posts/{post_id}", response_model=Post)
async def patch_post(post_id: int, post_update: PostUpdate):
    """Частично обновить пост"""
    post_index = next((i for i, p in enumerate(posts_db) if p.id == post_id), None)
    if post_index is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post = posts_db[post_index]
    update_data = post_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    
    return post

@app.delete("/api/posts/{post_id}", status_code=204)
async def delete_post(post_id: int):
    """Удалить пост"""
    post_index = next((i for i, p in enumerate(posts_db) if p.id == post_id), None)
    if post_index is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    posts_db.pop(post_index)
    return None
```

### Задача 2: Rate Limiting
```python
from fastapi import FastAPI, HTTPException, Request
from collections import defaultdict, deque
import time

app = FastAPI()

class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)
    
    def is_allowed(self, client_ip: str) -> bool:
        """Проверка, разрешен ли запрос"""
        now = time.time()
        client_requests = self.requests[client_ip]
        
        # Удаляем старые запросы
        while client_requests and client_requests[0] <= now - self.window_seconds:
            client_requests.popleft()
        
        # Проверяем лимит
        if len(client_requests) >= self.max_requests:
            return False
        
        # Добавляем текущий запрос
        client_requests.append(now)
        return True

rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests"
        )
    
    response = await call_next(request)
    return response

@app.get("/api/data")
async def get_data():
    return {"message": "Data retrieved successfully"}
```

### Задача 3: API с пагинацией
```python
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List, Optional
import math

app = FastAPI()

class PaginatedResponse(BaseModel):
    data: List[dict]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

def paginate_data(data: List[dict], page: int, per_page: int) -> PaginatedResponse:
    """Пагинация данных"""
    total = len(data)
    total_pages = math.ceil(total / per_page)
    
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_data = data[start:end]
    
    return PaginatedResponse(
        data=paginated_data,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )

# Тестовые данные
sample_data = [{"id": i, "name": f"Item {i}"} for i in range(1, 101)]

@app.get("/api/items", response_model=PaginatedResponse)
async def get_items(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page")
):
    """Получить элементы с пагинацией"""
    return paginate_data(sample_data, page, per_page)
```

Этот материал покрывает все основные аспекты REST API, которые важны для собеседования. Практикуйтесь с примерами и понимайте принципы проектирования API!
