# Troubleshooting Guide

## Onboarding Screen Not Showing
### Symptoms
- Browser stays on splash screen or redirects back to `/`.
- Console warning: “⚠️ VITE_API_URL is missing…”.
### Fixes
1. Ensure frontend dev server is running (`npm run dev`).
2. Confirm `localStorage.getItem("userChart")` is empty (clear storage if corrupt).
3. Check `VITE_API_URL` or Vite proxy target (`vite.config.js`) points to the backend.
4. Verify routes in `frontend/src/App.jsx` include `/onboarding` and that `SplashScreen` navigates forward (see `useNavigate` usage).
5. Inspect `frontend/src/lib/api.js` to ensure it exports `calculateNatalChart` and uses the expected base URL.
6. Inspect network tab for failed `/natal-chart` calls; see “CORS” section if 4xx/5xx.

## Profile Data Not Loading
### Symptoms
- Profile page shows “Sunucuya ulaşılamadı” or empty fields.
- Network tab shows `/api/profile` 503/404.
### Fixes
1. Verify backend has `MONGO_URI` set and Mongo Atlas cluster reachable.
2. Run `curl http://localhost:5000/api/health` to check Mongo status.
3. Confirm profile exists in Mongo (query with Atlas shell or `mongosh`).
4. For local dev without Mongo, expect offline banner; disable profile calls or mock responses.

## CORS Errors
### Symptoms
- Browser console: `blocked by CORS policy`.
### Fixes
1. Set `ALLOWED_ORIGINS=http://localhost:5173` (or prod domain) in backend env.
2. Restart backend after changing env vars.
3. Ensure requests originate from the configured URL (no trailing slash mismatch).
4. If using different port, append it explicitly.

## Mongo Connection Failures
### Symptoms
- Backend logs: `Mongo connection attempt failed`.
- Health endpoint shows `"status": "degraded"`.
### Fixes
1. Check `MONGO_URI` credentials; rotate if recently changed.
2. Ensure IP allowlist includes your machine or Render static IP.
3. Test with `mongosh "<MONGO_URI>" --eval "db.runCommand({ ping: 1 })"`.
4. If connection pooling settings are aggressive, relax `MONGO_*_TIMEOUT_MS` env values.

## Deployment Issues (Render)
### Symptom: HTTP 500 on Render
- Confirm environment variables set in Render dashboard.
- Ensure ephemeris files are available (package into repo or download during build).
- Inspect Render logs for Groq/OpenCage failures; missing keys cause 502s.
### Symptom: Build fails
- Verify `requirements.txt` installs under Render’s Python version (3.11 by default).
- Remove unused heavy dependencies if build times out.

## Missing Environment Variables
### Symptoms
- Flask logs warnings about missing keys; API responds with fallback text.
- Chat endpoint returns `"AI interpretation unavailable"`.
### Fixes
1. Double-check `.env` vs shell exports (Render uses dashboard values, not checked-in files).
2. Run `env | grep GROQ` (or `printenv` on Render shell) to confirm presence.
3. Re-deploy after adding variables; Render uses immutable release snapshots.

## Manual Endpoint Tests
```bash
# Health check
curl http://localhost:5000/api/health

# Create natal chart
curl -X POST http://localhost:5000/natal-chart \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","date":"1990-01-01","time":"12:00","city":"Istanbul"}'

# Upsert profile (requires Mongo)
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","date":"1990-01-01","time":"12:00","city":"Istanbul","chart":{}}'

# Chat message
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Bugün beni ne bekliyor?","chart":{}}'
```

Use Postman or Insomnia for more complex payloads and to inspect response headers for CORS debugging.
