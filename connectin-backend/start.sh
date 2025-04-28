#!/bin/bash
# This script starts the FastAPI application using uvicorn

set -e

echo "Starting the application..."

# Run database migrations if needed
# alembic upgrade head

# Start the FastAPI server with the correct settings for containerized environment
exec uvicorn app.main:app --host 0.0.0.0 --port 8000