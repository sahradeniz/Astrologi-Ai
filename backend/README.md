# Backend (Flask API)

This folder contains the Flask application that powers the Astrologi-AI API.

## Getting started

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use `.venv\\Scripts\\activate`
pip install -r requirements.txt
flask --app wsgi run --debug
```

The service exposes the following endpoints:

- `GET /api/health` — Health check for monitoring.
- `POST /api/horoscope` — Accepts a JSON payload with `name` and optional `birthdate` (`YYYY-MM-DD`) and returns a generated horoscope message.
- `POST /api/calculate-natal-chart` — Proxies the payload to the configured external astrology service at `/calculate_natal_chart`.
- `POST /api/calculate-synastry` — Proxies to the external astrology service `/api/calculate-synastry` endpoint.
- `POST /api/calculate-transits` — Proxies to the external astrology service `/api/calculate-transits` endpoint.
- `POST /api/chat/message` — Proxies chat messages to the external astrology service `/api/chat/message` endpoint.

### Running the test suite

Automated tests validate both the horoscope helper functions and the HTTP endpoint contract. After installing dependencies you can run:

```bash
pytest
```

### Environment variables

The application relies on the following environment variables to reach the external astrology API:

- `ASTROLOGY_API_BASE_URL` — **required** base URL of the upstream astrology service (for example `https://astro.example.com`).
- `ASTROLOGY_API_KEY` — Optional bearer token added to requests as the `Authorization` header.
- `ASTROLOGY_API_TIMEOUT` — Optional request timeout in seconds (defaults to `10`).

If you need to override settings you can provide a dotted Python path to `create_app` via the `FLASK_APP` environment variable (for example `FLASK_APP='app:create_app("configmodule")'`).
