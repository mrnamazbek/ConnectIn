# API Gateway - ConnectIn Microservices

Central entry point for all ConnectIn client requests. Handles routing, authentication verification, and request forwarding to appropriate microservices.

## Features

- **Request Routing**: Routes requests to auth, project, and notification services
- **JWT Verification**: Validates tokens before forwarding to protected endpoints
- **CORS Configuration**: Handles cross-origin requests
- **Error Handling**: Centralized error handling and logging
- **Health Checks**: Service health monitoring

## Architecture

```
Client → API Gateway → Auth Service (port 8001)
                    → Project Service (port 8002)
                    → Notification Service (port 8003)
```

## Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `GET /auth/google` - Google OAuth

### Projects (`/projects`)
- `GET /projects` - List projects (optional auth)
- `POST /projects` - Create project (requires auth)
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project (requires auth)
- `DELETE /projects/{id}` - Delete project (requires auth)
- `POST /projects/{id}/apply` - Apply to project (requires auth)
- `GET /projects/recommendations` - Get recommendations (requires auth)

### Notifications (`/notifications`)
- `GET /notifications` - Get user notifications (requires auth)
- `POST /notifications/{id}/read` - Mark as read (requires auth)

## Configuration

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:
- `SECRET_KEY`: JWT secret key
- `AUTH_SERVICE_URL`: Auth service URL
- `PROJECT_SERVICE_URL`: Project service URL
- `NOTIFICATION_SERVICE_URL`: Notification service URL

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker

```bash
# Build image
docker build -t connectin-api-gateway .

# Run container
docker run -p 8000:8000 --env-file .env connectin-api-gateway
```

## Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "2.0.0"
}
```
