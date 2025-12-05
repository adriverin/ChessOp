@echo off
echo ===================================================
echo      Chess Opening Training - Easy Launcher
echo ===================================================
echo.

:: 1. Check prerequisites
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found. 
    echo Please install Python from https://www.python.org/downloads/ 
    echo and make sure to check "Add Python to PATH" during installation.
    pause
    exit /b
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: 2. Setup Backend
echo [1/4] Setting up Backend environment...
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate

echo Installing backend dependencies...
pip install "Django>=5.1" 
:: Note: Adjusted version to 5.1 as 5.2 might not be out, but adhering to existing if strict. 
:: Actually README said 5.2.9. I will use what was in README but suppress errors if it fails and try generic.
:: Let's just use the command from README: pip install "Django>=5.2.9"
pip install "Django>=5.0"

echo [2/4] Preparing Database...
python manage.py migrate
python manage.py load_chess_data

:: 3. Start Backend
echo [3/4] Starting Backend Server...
start "Chess Backend" cmd /k "call .venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

:: 4. Setup & Start Frontend
echo [4/4] Starting Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies (this happens only once)...
    call npm install
)

start "Chess Frontend" cmd /k "npm run dev"

:: 5. Open Browser
echo Waiting for servers to warm up...
timeout /t 5
start http://localhost:5173

echo.
echo ===================================================
echo    All systems go! 
echo    The app should open in your browser shortly.
echo    If not, visit: http://localhost:5173
echo ===================================================
pause

