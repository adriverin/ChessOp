# Chess Opening Training

Backend (macOS): `python3 -m venv .venv && source .venv/bin/activate && pip install "Django>=5.2.9" && python manage.py migrate && python manage.py load_chess_data && python manage.py runserver 0.0.0.0:8000`

Backend (Windows, PowerShell): `py -3 -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install "Django>=5.2.9"; python manage.py migrate; python manage.py load_chess_data; python manage.py runserver 0.0.0.0:8000`

Frontend (both): `cd frontend && npm install && npm run dev` (Vite runs on http://localhost:5173 and proxies API/static/admin to http://127.0.0.1:8000)

Account: create one with `python manage.py createsuperuser --username demo --email demo@example.com` then log in at `/admin`; the React app will reuse that session cookie for authenticated endpoints.