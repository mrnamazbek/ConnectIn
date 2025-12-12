#!/bin/bash
# This script starts the FastAPI application using uvicorn

set -e

echo "Starting the application on Railway..."
echo "Environment: $RAILWAY_ENVIRONMENT"

# Run database migrations if needed
# alembic upgrade head

# Get the port from environment or use default
PORT=${PORT:-8000}
echo "Using port: $PORT"

# Start the FastAPI server with the correct settings for containerized environment
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT