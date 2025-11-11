# Local Setup Guide

## Prerequisites
- **Node.js 18+ and npm 9+** – required for the Vite-powered React frontend.
- **Python 3.11+** – backend tested with modern CPython; ensure `venv` module available.
- **MongoDB Atlas or local Mongo** – optional but recommended to exercise profile persistence.
- **Swiss Ephemeris data files** – download from the Swiss Ephemeris site and set `EPHE_PATH` (or `SWISSEPH_PATH`) to their directory.
- **Groq & OpenCage API keys** – obtain developer credentials for AI and geocoding features.

## Backend Installation
1. `cd backend`
2. Create virtualenv: `python -m venv .venv`
3. Activate:
   - macOS/Linux: `source .venv/bin/activate`
   - Windows PowerShell: `.venv\Scripts\Activate.ps1`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy example env (if not using shell exports):

```bash
cp .env.example .env  # create one if missing; see sample below
```

6. Run the server: `flask --app wsgi run --debug` (or `python app.py` for simple runs)

## Frontend Installation
1. Open a new terminal: `cd frontend`
2. Install dependencies: `npm install`
3. Create `.env` (or `.env.local`) with `VITE_API_URL=http://localhost:5000`
4. Start dev server: `npm run dev` (opens on http://localhost:5173)

## Environment Variable Samples

### `backend/.env` (local-only example)
```ini
FLASK_ENV=development
SECRET_KEY=dev-secret-please-change
ALLOWED_ORIGINS=http://localhost:5173
GROQ_API_KEY=gsk_your_local_testing_key
GROQ_MODEL=llama-3.1-8b-instant
OPENCAGE_API_KEY=oc_your_testing_key
MONGO_URI=mongodb://localhost:27017/astrologi_ai
MONGO_DB_NAME=astrologi_ai
MONGO_PROFILE_COLLECTION=profiles
EPHE_PATH=./ephe
```

### `frontend/.env`
```ini
VITE_API_URL=http://localhost:5000
```

> Never commit real secrets. Use `.env.local` or shell exports for production.

## Common Startup Errors & Fixes
- **`ValueError: city is required.`** – onboarding payload missing `city`; verify form bindings in `Onboarding.jsx`.
- **`OpenCage request failed` / 502** – ensure `OPENCAGE_API_KEY` is valid and network reachable.
- **`ImportError: swisseph`** – install `pyswisseph` (already in requirements) and confirm ephemeris files via `EPHE_PATH`.
- **`MongoUnavailable: MONGO_URI is not configured`** – set `MONGO_URI` or run without Mongo (frontend will show “offline” banner).
- **`CORS error` when calling API** – align `ALLOWED_ORIGINS` with frontend URL and restart backend.
- **`npm run dev` fails with ENOENT** – run from `frontend/` directory; ensure `node_modules` installed.
- **`Groq API hatası` in logs** – set `GROQ_API_KEY`; without it, backend falls back to placeholder text but logs warnings.

## Verifying the Stack
- Backend health: `curl http://localhost:5000/api/health`
- Run backend tests: `cd backend && pytest`
- Lint frontend: `cd frontend && npm run lint`
- Build frontend bundle: `npm run build` (should produce `dist/` without warnings)
- Create natal chart:
  ```bash
  curl -X POST http://localhost:5000/natal-chart \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","lastName":"User","email":"test@example.com","date":"1990-01-01","time":"12:00","city":"Istanbul"}'
  ```
- Frontend: open http://localhost:5173, complete onboarding, ensure insight loads and chat responds.
