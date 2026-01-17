#!/bin/bash

# Start both backend and frontend in development mode

echo "Starting Hooklog development servers..."
echo ""

# Start backend in background
echo "Starting backend on http://localhost:3000"
cd "$(dirname "$0")"
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend on http://localhost:5173"
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ Backend: http://localhost:3000"
echo "✓ Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
