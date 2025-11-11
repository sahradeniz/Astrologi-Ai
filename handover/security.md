# Security Practices & Findings

## Secret Management
- **Do not commit secrets** – rotate all keys found in `backend/.env` (Groq, OpenCage, Mongo URI, HF token) and purge the file from version control history.
- **Use environment stores** – inject secrets via Render/Vercel dashboards or a vault; keep `.env` limited to local development templates.
- **Rotation cadence** – set quarterly rotation reminders, especially for Groq and Mongo credentials exposed in the repo.

## API Key Safety
- Store keys in environment variables only; avoid logging or echoing them in console output.
- In `backend/app.py`, remove `print` statements that expose Groq key prefixes and payloads before deploying.
- For client-side configuration, never embed secrets—render public URLs only (`VITE_API_URL`), not API keys.

## Logging & PII Redaction
- Replace current verbose stdout logging (payload previews, chart summaries, Groq responses) with structured logging that redacts personal data.
- Mask or hash email addresses and birth data when logging profile operations.
- Set Flask logger to INFO in production and gate debug logs behind an environment flag.

## CORS & Authentication
- Configure `ALLOWED_ORIGINS` per environment; avoid wildcards when `supports_credentials=True`.
- Disable credentials support unless cookies/sessions are introduced.
- Add authentication to `/api/profile` endpoints before storing or retrieving PII. Consider JWT or OAuth-backed sessions.
- Rate-limit endpoints (`Flask-Limiter`) and add CSRF protection if browser-based auth is implemented.

## Known Vulnerabilities & Mitigations
- **Leaked secrets** – rotate immediately; confirm no unauthorised access via provider dashboards.
- **Weak `SECRET_KEY` default** – enforce non-empty, random keys in production (fail fast if still `change-me`).
- **Torch version mismatch** – `torch==2.9.0` targets CUDA 12.4 wheels; installation fails on CPU-only hosts like Render. Either drop the dependency (currently unused) or replace with a CPU-compatible build (`pip install torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu`).
- **Library bloat (accelerate/transformers)** – remove unused packages to shrink attack surface and simplify CVE tracking.
- **Dependency monitoring** – pin versions of Flask, requests, pymongo, and run `pip-audit`/`npm audit` regularly.
- **LocalStorage PII** – document risk (shared devices) and provide “clear data” controls in the UI.
- **Logging sensitive data** – refactor Groq integration to avoid printing entire responses; store minimal metadata.

## Recommended Controls
- Enable HTTPS everywhere (Render handles TLS; ensure frontend URLs use HTTPS).
- Implement Content Security Policy headers at the frontend host.
- Use MongoDB user with least privileges (read/write on single database).
- Back up Mongo Atlas with encrypted snapshots and enforce IP allowlisting.
- Document incident response steps (secret rotation, log review) for quick execution.
