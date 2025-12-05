# Chess Opening Training

Backend (macOS): `python3 -m venv .venv && source .venv/bin/activate && pip install "Django>=5.2.9" && python manage.py migrate && python manage.py load_chess_data && python manage.py runserver 0.0.0.0:8000`

Backend (Windows, PowerShell): `py -3 -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install "Django>=5.2.9"; python manage.py migrate; python manage.py load_chess_data; python manage.py runserver 0.0.0.0:8000`

Frontend (both): `cd frontend && npm install && npm run dev` (Vite runs on http://localhost:5173 and proxies API/static/admin to http://127.0.0.1:8000)

Account: create one with `python manage.py createsuperuser --username demo --email demo@example.com` then log in at `/admin`; the React app will reuse that session cookie for authenticated endpoints.

## How to Open on Windows (Grandma Edition 👵)

If the instructions above look like gibberish, follow these simple steps:

1.  **Install the Basics** (You only do this once)
    *   **Python**: Go to [python.org/downloads](https://www.python.org/downloads/). Download the big yellow button.
        *   ⚠️ **VERY IMPORTANT**: When the installer opens, check the box at the bottom that says **"Add Python to PATH"** before you click Install.
    *   **Node.js**: Go to [nodejs.org](https://nodejs.org/). Download the version on the left (LTS). Install it by clicking "Next" until it's done.

2.  **Start the App**
    *   Open the folder where you saved this project.
    *   Find the file named `run_windows.bat` (it might just say `run_windows`).
    *   Double-click it! 🖱️

3.  **Play!**
    *   Two black windows will appear. Don't close them; they are the engine of the app.
    *   Your web browser should automatically open the game.
    *   If it doesn't, open Chrome or Edge and type `http://localhost:5173` in the top bar.

## How to Open on Linux (Grandma Edition 🐧)

1.  **Install the Basics**
    *   Open your Terminal.
    *   Run this command to install Python and Node.js (for Ubuntu/Debian/Mint):
        `sudo apt install python3 python3-venv nodejs npm`

2.  **Start the App**
    *   Open the folder where you saved this project.
    *   Right-click `run_linux.sh` → Properties → Permissions → check "Allow executing file as program".
    *   Now you can double-click `run_linux.sh` and choose "Run in Terminal".
    *   (Or from the terminal: `./run_linux.sh`)

3.  **Play!**
    *   The browser will open automatically. Enjoy!
