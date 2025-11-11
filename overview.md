# Astrologi-AI Handover Overview

## System Snapshot
- Dual-app project: Flask REST API in `backend/` and Vite-powered React SPA in `frontend/`.
- Core flow: onboarding form -> backend natal-chart calculation -> Groq-powered interpretations -> optional Mongo persistence -> frontend renders insights and chat.
- Deployment configured only for the backend via Render (`render.yaml`); frontend currently assumed to run from Vite dev server or a manual static build.

## Architecture & Module Map

### Data Flow (happy-path)
1. User enters birth data in the onboarding screen (`frontend/src/pages/Onboarding.jsx`), which calls `calculateNatalChart` from `frontend/src/lib/api.js`.
2. The API layer posts to `/natal-chart`; backend handler `_handle_natal_chart_request` (`backend/app.py:1159`) validates input, geocodes the city, generates planetary positions with Swiss Ephemeris, and calls Groq for a short interpretation.
3. The resulting chart is cached in `localStorage` and optionally persisted to MongoDB through `/api/profile` (same module).
4. Home/Profile screens request `/interpretation` for richer archetype data; the backend composes archetype themes (`backend/archetype_engine.py`) and Groq interpretations.
5. Chat view sends free-form questions to `/chat/message`, which forwards contextual prompts to Groq.

### Backend Highlights
- `backend/app.py`: single-module Flask app defining routes, chart math, AI orchestration, Mongo persistence, and CORS setup.
- `backend/archetype_engine.py`: pure-Python helpers extracting themes, notable aspects, and narrative scaffold from chart JSON.
- `backend/db.py`: resilient MongoDB client cache with retry logic, environment-driven pool sizing, `mongo_healthcheck` used by `/api/health`.
- `backend/config.py`: minimal config dataclasses; currently only sets `SECRET_KEY`.
- `backend/wsgi.py`: Render/Gunicorn entry point.
- Environment bootstrapping: `load_dotenv` targets `backend/.env`; Swiss Ephemeris path pulled from `EPHE_PATH`.

### Frontend Highlights
- Bootstrapped via `frontend/src/main.jsx` and Chakra UI theme.
- `frontend/src/App.jsx`: router shell, bottom navigation, backend health banner, initial `fetch` to `/api/health`.
- `frontend/src/lib/api.js`: axios wrapper centralising base URL detection, errors, and route helpers for natal chart, interpretation, synastry, profile CRUD, and chat.
- Page modules compose UI flows: onboarding (collects birth data, triggers backend calls, saves `localStorage`), home/profile/story views consume cached chart + backend insights, chat view streams messages through API.
- Assets like `tmp_tokenizer/` are shipped with the repo for future Hugging Face usage but currently unused.

## Third-Party Integrations
| Service | Purpose | Implementation | Configuration | Notes & Risks |
| --- | --- | --- | --- | --- |
| **Groq Chat Completions** | Generates interpretations, synastry narratives, and chat replies. | `call_groq`, `get_ai_interpretation`, `_request_refined_interpretation`, `_handle_chat_request` in `backend/app.py`. | `GROQ_API_KEY`, `GROQ_MODEL`, optional `GROQ_API_URL` (`backend/app.py:56-61`). | Hard vendor dependency; rate limits/latency affect chart generation. Key prefix currently logged (see Security). |
| **OpenCage Geocoding** | Resolves city -> lat/lon/timezone for chart math. | `fetch_location` (`backend/app.py:548-586`). | `OPENCAGE_API_KEY`. | Strict daily quota; errors bubble to users immediately. |
| **Swiss Ephemeris (pyswisseph)** | Astronomical calculations for planets, houses, aspects. | `calc_planets`, `calc_houses`, `julian_day` etc. (`backend/app.py:690-973`). | `EPHE_PATH` (backend `.env` uses `SWISSEPH_PATH` alias). | Requires ephemeris data files present at runtime; portability risk on serverless targets. |
| **MongoDB Atlas** | Persist user profiles + charts. | `backend/db.py` and `/api/profile` routes (`backend/app.py:1291-1349`). | `MONGO_URI`, optional pool tuning vars. | No auth layer in app; relies on network ACLs. Missing connection string rotation support. |
| **Chakra UI / Framer Motion / Lucide** | Frontend component library & animation. | Throughout `frontend/src`. | None (npm). | Ensure bundle size monitored for mobile. |
| **Axios** | HTTP client for frontend API calls. | `frontend/src/lib/api.js`. | `VITE_API_URL` or proxy fallback. | Timeout set to 15s; no retries or offline queue. |

## Data & Storage
- **MongoDB**: Profiles keyed by email, includes first/last name, birth data, and full chart JSON (`backend/app.py:1316-1337`). No schema enforcement beyond Python validation.
- **LocalStorage**: `userChart`, `userProfile`, `userInsight` cached client-side (`frontend/src/pages/Home.jsx`, `Profile.jsx`, `Onboarding.jsx`). Important for offline but raises privacy concerns on shared devices.
- **Ephemeris files**: Expect Swiss ephemeris data accessible relative to backend working dir.
- **tmp_tokenizer/**: Hugging Face tokenizer assets stored locally; ensure licensing compliance if unused.

## Security & Vulnerability Findings
1. **Real secrets committed to repo** – `backend/.env` contains live `GROQ_API_KEY`, `OPENCAGE_API_KEY`, Mongo credentials, and Hugging Face token. Rotate immediately, remove the file from version control history, and rely on environment injection (Vault/Render secrets).  
2. **Secrets logged to stdout** – `backend/app.py:320-333` and `backend/app.py:430-454` print Groq model, key prefix, payload, and response snippets. In hosted environments these land in central logs; remove `print` statements or redact via logger with structured metadata.  
3. **Weak default Flask secret** – `backend/config.py:18` falls back to `"change-me"`. Enforce `SECRET_KEY` presence in production and fail fast otherwise.  
4. **Unauthenticated profile API** – `backend/app.py:1291-1349` exposes profile read/write by email without authentication or authorization. Attackers can enumerate and overwrite profiles; introduce auth (JWT/session) or disable until ready.  
5. **Over-broad CORS** – `supports_credentials=True` with `ALLOWED_ORIGINS` defaulting to localhost (`backend/app.py:40-48`). In production, set explicit origin list per environment and disable credentials unless needed.  
6. **PII in logs** – Chat and interpretation responses (`backend/app.py:331-332`) are logged wholesale; these contain user-specific spiritual guidance. Use debug logging with redaction or omit bodies.  
7. **Dependency posture** – Backend requirements leave core libraries unpinned (`Flask`, `requests`, `pymongo`), while heavy packages (`torch==2.9.0`, `accelerate`, `transformers`) are unused. This bloats deploys and increases CVE surface. Frontend dependencies are semi-recent but should track security advisories via `npm audit`.  
8. **Client-side privacy** – Full birth data persists in `localStorage` (`frontend/src/pages/Onboarding.jsx`). Document this and offer a “clear data” option (profile settings?) to avoid shared-device leakage.  
9. **Error handling gaps** – `_handle_natal_chart_request` (`backend/app.py:1187-1204`) returns raw exception text to clients; sanitize user-facing error messages.  
10. **Repository hygiene** – `frontend/node_modules/`, `venv/`, `joviaenv/` directories are tracked locally; ensure they are excluded via `.gitignore` to avoid accidental commits (already ignored, but double-check).  

## Dependency Overview
**Backend (`backend/requirements.txt`):**
- Flask, Flask-Cors, requests, pytz, python-dotenv, pymongo, gunicorn.
- Swiss Ephemeris (`pyswisseph`), astronomy maths.
- AI stack placeholders: `torch`, `accelerate`, `transformers`, `tokenizers` – currently unused.

**Frontend (`frontend/package.json`):**
- React 18, React Router v6, Chakra UI, Chakra icons, Emotion styling.
- Framer Motion (animations), Lucide icons.
- Axios for HTTP; ESLint + Vite tooling.

Recommend running `pip list --outdated` and `npm audit` periodically, and pruning unused heavyweight libraries before deploying.

## Developer Onboarding
**Prerequisites**
- Python 3.10+ with `venv` support, Node.js 18+, npm 9+.
- Access to Swiss Ephemeris data (point `EPHE_PATH` or set `SWISSEPH_PATH` to packaged ephemeris).
- Valid API keys: Groq, OpenCage, Mongo Atlas URI (read/write).

**Setup Steps**
1. Clone repo; ensure secrets are injected via env (do **not** rely on `backend/.env`).
2. Backend: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`. Add `EPHE_PATH`, `GROQ_API_KEY`, `OPENCAGE_API_KEY`, `MONGO_URI`, `SECRET_KEY` to environment.
3. Start backend locally: `flask --app wsgi run --debug` or `python app.py` for quick checks.
4. Frontend: `cd frontend && npm install && npm run dev`. Provide `frontend/.env` with `VITE_API_URL=http://localhost:5000`.
5. Optional: Seed Mongo `profiles` collection manually for testing or rely on POST flow.

**Pitfalls**
- Missing OpenCage key blocks onboarding (city lookup fails with 502). Provide fallback or mock service for local dev.
- Swiss ephemeris files absent -> `pyswisseph` raises errors; confirm data path.
- Without Mongo, profile endpoints return 503; frontend tolerates by falling back to local storage but surfaces warnings.
- Render free tier has cold starts; Groq calls may time out (30 s). Adjust timeouts or add retries.

## Deployment & Infrastructure
- Backend deploy defined in `render.yaml`: Python service, builds with `pip install -r requirements.txt`, served via `gunicorn wsgi:app`.
- No documented deployment for frontend; likely intended for Vercel/Netlify or Render static site—needs pipeline definition (build `npm run build`, host `dist/`).
- Secrets should be stored in Render environment variables. Ensure `EPHE_PATH` matches server file layout (may require bundling ephemeris files into image or downloading at boot).
- Logging: currently stdout with verbose prints; align with Render log viewer and remove secrets.
- Monitoring: `/api/health` checks Mongo status; extend to include third-party API probes or feature flags.

## Operational Considerations
- Rate limiting absent; consider adding Flask-Limiter or API gateway protection before public launch.
- Add retries and circuit breakers around Groq/OpenCage calls to avoid cascading failures.
- Tests: backend has pytest scaffolding per `backend/README.md`, but none committed. Establish CI/lint/test workflows (GitHub Actions).

## Next Steps & Roadmap
**Must-fix before taking ownership**
1. Rotate all leaked secrets (`backend/.env`) and purge from repo history. Configure environment-based secret injection.
2. Remove sensitive logging (`backend/app.py:320-333`, `backend/app.py:430-454`) and enforce secure `SECRET_KEY`.
3. Lock down `/api/profile` endpoints with authentication/authorization or disable them until auth exists.

**Short-term (next 1-2 sprints)**
1. Prune/justify heavy unused dependencies (torch/accelerate/transformers) to slim deployments.
2. Harden error handling and validation (limit message length, sanitize exception messages, add input schemas).
3. Set up automated tests + lint pipelines for both backend and frontend.

**Mid-term**
1. Implement structured logging & monitoring (Groq/OpenCage latency, failure alerts).
2. Add caching or rate limiting for external APIs; support graceful degradation when Groq unavailable.
3. Design a deployment strategy for the frontend (CI/CD, domain, environment-specific configs).

**Long-term**
1. Introduce user accounts/auth + secure data storage (encryption-at-rest, consent flows).
2. Consider modularising backend (Blueprints/services) as features grow.
3. Evaluate portability away from Groq/OpenCage (e.g., abstract AI/geocoding providers) to reduce vendor lock-in.

This overview should equip you to stabilise the system, prioritise security fixes, and plan future evolution confidently. Reach out once secrets are rotated to validate integrations end-to-end.
