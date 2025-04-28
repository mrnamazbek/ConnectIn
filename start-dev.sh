#!/bin/bash

# Start the backend server
cd connectin-backend
echo "Starting the backend server..."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 3

# Start the frontend development server
cd ../connectin-frontend
echo "Starting the frontend development server..."
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Set up trap to handle termination
trap cleanup SIGINT SIGTERM

# Keep the script running
wait 