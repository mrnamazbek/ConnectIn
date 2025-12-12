# ConnectIn - Microservices Quick Start

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Environment is already configured in .env
# Database credentials and JWT secret are set
```

### 2. Start Core Services (Recommended)
```bash
docker-compose up --build
```

**This starts:**
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Auth Service (port 8001) - JWT authentication
- Project Service (port 8002) - Projects & teams
- API Gateway (port 8000) - Central routing
- Frontend (port 3000) - Production React build

### 3. Start with ML Service (Optional)
```bash
docker-compose --profile full up --build
```

## 📊 Service Status

### Check Health
```bash
# API Gateway
curl http://localhost:8000/health

# Auth Service
curl http://localhost:8001/health

# Project Service  
curl http://localhost:8002/health
```

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **Auth Service**: http://localhost:8001/docs
- **Project Service**: http://localhost:8002/docs

## 🎯 Test the Services

### Register a User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "securepass123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=securepass123"
```

### Create Project (requires token)
```bash
TOKEN="<your_access_token_from_login>"

curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "AI Chatbot",
    "description": "Building an intelligent chatbot",
    "tech_stack": ["Python", "FastAPI", "OpenAI"],
    "required_roles": ["Backend Developer", "ML Engineer"]
  }'
```

## 🛑 Stop Services

```bash
# Stop and keep data
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

## ⚠️ Known Issues & Solutions

### Issue: Auth service is unhealthy
**Solution**: Already fixed - using curl-based healthcheck

### Issue: Database tables missing
**Cause**: New database, no migrations run
**Solution**: Microservices auto-create their tables on startup:
- Auth service creates: `users` table
- Project service creates: `projects`, `applications` tables

### Issue: ML service fails
**Cause**: Expects legacy schema (`skills`, `user_skills` tables)
**Solution**: ML service is optional - skip it or use `--profile full` when ready

## 📁 Service Architecture

```
http://localhost:3000  ← Frontend (React + Nginx)
          ↓
http://localhost:8000  ← API Gateway (Routes everything)
          ↓ ↓ ↓
   /auth  /projects  /notifications
      ↓       ↓           ↓
    :8001   :8002       :8003
```

## 🔧 Development Mode

For local development with hot-reload:

```bash
# Frontend (already running)
cd frontend && npm run dev  # http://localhost:5173

# Backend services (individual)
cd auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## 📖 Next Steps

1. ✅ Services are running
2. Test authentication flow (register → login)
3. Create test projects
4. Integrate frontend with API Gateway
5. Apply glassmorphism design to pages

---

**For detailed architecture docs**, see `completion_walkthrough.md` in the brain folder.
