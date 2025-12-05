#!/bin/bash

echo "==================================================="
echo "     Chess Opening Training - Easy Launcher"
echo "==================================================="
echo ""

# 1. Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not found."
    echo "Please install Python 3 using your package manager (e.g., 'sudo apt install python3 python3-venv')."
    read -p "Press Enter to exit..."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js/npm is not found."
    echo "Please install Node.js (e.g., 'sudo apt install nodejs npm')."
    read -p "Press Enter to exit..."
    exit 1
fi

# 2. Setup Backend
echo "[1/4] Setting up Backend environment..."
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing backend dependencies..."
pip install "Django>=5.2.9"

echo "[2/4] Preparing Database..."
python manage.py migrate
python manage.py load_chess_data

# 3. Start Backend
echo "[3/4] Starting Backend Server..."
# Kill any existing running instances on these ports to avoid conflicts
fuser -k 8000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# 4. Setup & Start Frontend
echo "[4/4] Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies (this happens only once)..."
    npm install
fi

echo "Starting Frontend Server..."
npm run dev &
FRONTEND_PID=$!

# 5. Open Browser
echo "Waiting for servers to warm up..."
sleep 5
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v gnome-open &> /dev/null; then
    gnome-open http://localhost:5173
else
    echo "Could not detect browser opener. Please open http://localhost:5173 manually."
fi

echo ""
echo "==================================================="
echo "   App is running!"
echo "   Press Ctrl+C in this terminal to stop all servers."
echo "==================================================="

# Wait for user to interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait

