# Astrologi-AI System Overview

## Project Purpose
Jovia delivers astrology-inspired guidance by combining precise celestial calculations with Groq-generated storytelling. The experience spans a React frontend, a Flask backend, and MongoDB persistence, integrating Swiss Ephemeris for chart math and OpenCage for geocoding. This overview equips new maintainers to extend the platform securely while introducing features such as transits, rituals, or mobile clients.

## Architecture At A Glance
- **Frontend (React + Vite)** renders onboarding, insights, profile, and chat experiences. It communicates with the backend via REST over HTTPS using Axios and the `VITE_API_URL` base.
- **Backend (Flask)** exposes endpoints for chart generation, archetype reports, chat, and profile persistence. It orchestrates Swiss Ephemeris calculations, Groq LLM prompts, and MongoDB storage.
- **Database (MongoDB Atlas)** stores user profiles and generated charts keyed by email. The API can operate in “local-only” mode when Mongo is unavailable.
- **External APIs**
  - **OpenCage** provides geocoding (city → lat/lon/timezone) for natal charts.
  - **Swiss Ephemeris** (pyswisseph) calculates planetary positions, houses, and aspects.
  - **Groq LLM** generates narrative interpretations, synastry insights, and chat replies.

## Module Interaction & Data Flow
### Onboarding Flow
1. `Onboarding.jsx` checks `localStorage` for an existing profile/chart; if absent it renders the form.
2. Submission triggers `calculateNatalChart` (`/natal-chart`) which delegates to `_handle_natal_chart_request` for validation, OpenCage geocoding, Swiss Ephemeris calculations, and an optional Groq mini-interpretation.
3. The resulting chart is cached client-side. In parallel, `/api/profile` upserts the profile document in MongoDB via `get_profile_collection` (`backend/db.py`).

### Dashboard & Interpretation
1. `Home.jsx` and `Profile.jsx` read cached chart data and request `/interpretation` when fresh insights are needed.
2. The backend invokes `generate_full_archetype_report` (`archetype_engine.py`) to derive themes, behaviour patterns, and life expression.
3. `_request_refined_interpretation` and `get_ai_interpretation` call Groq for rich narratives, falling back to deterministic text when Groq is unavailable.

### Chat Experience
1. `AiChat.jsx` sends messages to `/chat/message` together with optional chart context and prior turns.
2. Backend composes system prompts plus chat history, then calls `call_groq`. Responses are returned as plain text and rendered immediately.

### Synastry & Future Transits
- Synastry flow posts to `/calculate_synastry_chart` with two birth payloads. The backend reuses natal builder utilities, computes cross-aspects, and optionally calls Groq.
- Transit endpoints are not yet implemented but can build on `calc_planets` and `archetype_engine` foundations once roadmap work begins.

## Core Modules & Responsibilities
- **Frontend**
  - `App.jsx`: Router shell, health checks, bottom navigation, and toast notifications for backend status.
  - `pages/Onboarding.jsx`: Collects birth data, formats payload, and stores chart/profile in `localStorage`.
  - `pages/Home.jsx` & `pages/Profile.jsx`: Render insights, call `getInterpretation`, and surface archetype dashboards.
  - `pages/AiChat.jsx`: Simple chat UI with Chakra components; leverages `sendChatMessage`.
  - `lib/api.js`: Axios wrapper that normalises endpoints, handles errors, and warns when `VITE_API_URL` is absent.
- **Backend**
  - `app.py`: Main Flask application; wires CORS, environment loading, Swiss Ephemeris setup, Mongo connection bootstrap, and all REST routes.
  - `archetype_engine.py`: Pure-python analysis layer deriving themes, tone, behaviour patterns, and deterministic fallback narratives.
  - `db.py`: Connection cache with retry/backoff, health checks, and pool sizing based on environment variables.
  - `config.py`: Dataclass configurations providing `SECRET_KEY` and debug flags (needs hardening in production).
  - `wsgi.py`: Entry point for Gunicorn/Render deployments.
- **Infrastructure Artifacts**
  - `render.yaml`: Defines Render web service build/start commands.
  - `backend/requirements.txt` & `frontend/package.json`: Dependency manifests.
  - `tmp_tokenizer/`: Hugging Face tokenizer assets (currently unused; ensure licensing compliance).

## Technologies & Libraries
- **Frontend:** React 18, React Router v6, Chakra UI, Emotion, Framer Motion, Lucide icons, Axios, Vite (dev server + build), ESLint.
- **Backend:** Flask, Flask-Cors, python-dotenv, requests, pytz, pymongo, gunicorn, pyswisseph. Repository includes but currently does not use torch/accelerate/transformers.
- **Tooling:** pytest (backend), Node/npm scripts, Render deployment manifest.

## Third-Party Integrations
| Service | Purpose | Implementation | Configuration | Notes & Migration Risks |
| --- | --- | --- | --- | --- |
| **Swiss Ephemeris (`pyswisseph`)** | Deterministic planetary calculations and house cusps. | `calc_planets`, `calc_houses`, and helpers in `backend/app.py`. | `EPHE_PATH` or `SWISSEPH_PATH` pointing to ephemeris files bundled with the app. | Ephemeris data must ship with each deploy; switching to another astro library would require rewriting the math layer (moderate effort). |
| **Groq Chat Completions** | Generates chart interpretations, synastry narratives, and chat replies. | `call_groq`, `get_ai_interpretation`, `_request_refined_interpretation`, `_handle_chat_request` in `backend/app.py`. | `GROQ_API_KEY`, `GROQ_MODEL`, optional `GROQ_API_URL`. | High vendor coupling; build abstraction to fall back to OpenAI/Anthropic or local models to avoid lock-in and pricing shocks. |
| **OpenCage Geocoding** | City → lat/lon/timezone lookup for chart computation. | `fetch_location` in `backend/app.py`. | `OPENCAGE_API_KEY`. | Daily quotas apply; cache results and evaluate secondary geocoders (Mapbox, Google) to mitigate outages. |
| **MongoDB Atlas** | Stores user profiles and cached charts. | `backend/db.py` for connection pooling, `/api/profile` routes in `backend/app.py`. | `MONGO_URI`, `MONGO_DB_NAME`, `MONGO_PROFILE_COLLECTION`. | Atlas connection string and retry options are provider-specific; abstract data access to prepare for managed Postgres or Dynamo alternatives. |

## Backend API Surface
| Method & Route | Purpose | Implementation Notes |
| --- | --- | --- |
| `POST /api/profile` | Upsert profile + chart payload keyed by email. | Validates minimal fields; uses `find_one_and_update` with `ReturnDocument.AFTER`. |
| `GET /api/profile?email=` | Fetch profile for given email. | Returns 404 if missing; unauthenticated; serialises `_id` to string. |
| `POST /natal-chart` / `/api/calculate-natal-chart` | Build natal chart, compute houses/aspects, optional AI summary. | Wraps `build_natal_chart`; `/natal-chart` is public alias with same handler. |
| `POST /calculate_synastry_chart` / `/api/calculate-synastry` | Compare two charts; optional Groq relationship narrative. | Reuses natal builder for each person; merges results and aspects. |
| `POST /interpretation` / `/api/interpretation` | Generate full archetype report + Groq JSON payload. | Calls `generate_full_archetype_report`, `_request_refined_interpretation`, fallback to `get_ai_interpretation`. |
| `POST /chat/message` / `/api/chat/message` | Free-form chat replies from Groq with optional chart context. | Builds system prompts, merges history, and returns plain-text reply. |
| `GET /api/health` | Report service status + Mongo health. | Adds `mongo` detail block or “disabled” status when `MONGO_URI` absent. |

## Environment Variables
| Variable | Description |
| --- | --- |
| `GROQ_API_KEY` | Secret token for Groq LLM requests. Mandatory for AI outputs. |
| `GROQ_MODEL` | Groq model identifier (default `llama-3.1-8b-instant`). |
| `GROQ_API_URL` | Override for Groq REST endpoint (default official path). |
| `OPENCAGE_API_KEY` | API key for geocoding. Required for natal chart creation. |
| `MONGO_URI` | Full MongoDB Atlas connection string. Without it, profile endpoints return 503. |
| `MONGO_DB_NAME`, `MONGO_PROFILE_COLLECTION` | Optional overrides for database/collection names. |
| `SECRET_KEY` | Flask session/signing key; must be strong in production (defaults to `change-me`, which is insecure). |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed by CORS; defaults to `http://localhost:5173`. |
| `EPHE_PATH` (or `SWISSEPH_PATH`) | Filesystem path to Swiss ephemeris data. |
| `HF_TOKEN` | Hugging Face token (present in repo but unused; should be rotated if still valid). |

## Security Audit Summary
- **Secrets exposed**: `backend/.env` contains live API keys and Mongo credentials. Rotate immediately and purge from history.
- **Logging leaks**: Debug prints around `backend/app.py` lines ~320 and ~430 dump Groq key prefixes, payload previews, and responses; remove or redact before deployment.
- **Weak defaults**: `SECRET_KEY` falls back to `change-me`; fail fast when unset and use long random values in production.
- **CORS scope**: `supports_credentials=True` with permissive origins is risky; lock `ALLOWED_ORIGINS` per environment and disable credentials unless sessions are added.
- **Authentication gap**: `/api/profile` read/write routes are public, enabling PII exfiltration and tampering; introduce JWT or session-based auth.
- **Input validation**: Birth data accepts future or malformed values if they pass string parsing; add stricter validation and sanitise error messages.
- **Dependency hygiene**: Heavy unused packages (torch/accelerate/transformers) broaden CVE surface and `torch==2.9.0` fails on CPU-only hosts; prune or make optional.
- **Error handling**: `_handle_natal_chart_request` and peers return raw exceptions; replace with user-friendly messages and structured logging.

## Developer Onboarding
1. **Tools**: Install Python ≥3.11, Node ≥18, npm ≥9, Docker (optional for Mongo mocks), and Swiss ephemeris files.
2. **Backend setup**: `cd backend`, create virtualenv, `pip install -r requirements.txt`, export required environment variables (or use `.env` strictly for local dev).
3. **Frontend setup**: `cd frontend`, `npm install`, configure `VITE_API_URL` or rely on Vite proxy (`vite.config.js`) during dev.
4. **Mongo**: Provision Atlas cluster or run local MongoDB; obtain URI and include credentials in secure env injection.
5. **Verification**: Run `pytest` (backend), `npm run lint`, and `npm run build` (frontend) to ensure fresh clones compile and tests pass.
6. **Pitfalls**: Missing OpenCage key blocks onboarding, absent ephemeris path breaks chart math, lacking Mongo triggers 503 warnings (UI falls back to offline mode), and misconfigured `VITE_API_URL` leads to CORS failures.

## Deployment Notes
- **Backend**: Render service defined in `render.yaml`. Build step installs Python deps, launch via `gunicorn wsgi:app`. Ensure ephemeris files are bundled or fetched during deploy.
- **Frontend**: No automated pipeline yet; recommended to deploy to Vercel/Netlify after `npm run build`, serving `dist/`. Provide production `VITE_API_URL`.
- **Secrets**: Configure through Render/Vercel dashboards; do not commit `.env`.
- **Monitoring**: `/api/health` reports Mongo status but lacks deeper checks; extend for external API dependency health.
- **CI/CD**: Set up GitHub Actions (or similar) to run backend `pytest`, frontend lint/build, and deployment previews on pull requests before promoting to production.

## Prioritised Next Steps
### Must-Fix
1. Rotate leaked secrets, purge `.env` from history, and adopt managed secret injection.
2. Remove sensitive logging and enforce strong `SECRET_KEY` values.
3. Secure or disable `/api/profile` endpoints until authentication is available.

### Short Term (next sprint)
- Trim unused AI dependencies; lock remaining libraries to audited versions.
- Harden error handling (friendly user messages, shield raw exceptions).
- Add backend/frontend lint + test automation (GitHub Actions).

### Mid Term
- Introduce auth/session model to protect profile data.
- Implement retries/circuit breakers for Groq/OpenCage calls.
- Establish production-grade logging with redaction and metrics.

### Long Term
- Expand feature set (transit tracking, personalized rituals).
- Plan for data privacy compliance (consent, encryption at rest, data export/delete tools).
- Explore provider abstraction to reduce reliance on Groq/OpenCage and support multi-region scaling.

## Conclusion
The current stack already marries precise astro math with expressive AI, but secrecy, observability, and auth gaps must be addressed before scaling. With secrets rotated, logging sanitised, and an auth layer in place, Jovia can evolve toward richer features such as transits and personalised rituals while remaining secure and maintainable. Use this guide alongside the setup, security, troubleshooting, and roadmap documents to plan the next iterations confidently.
