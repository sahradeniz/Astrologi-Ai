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

### Running the test suite

Automated tests validate both the horoscope helper functions and the HTTP endpoint contract. After installing dependencies you can run:

```bash
pytest
```

### Environment variables

The application currently relies on default configuration only. If you need to override settings you can provide a dotted Python path to `create_app` via the `FLASK_APP` environment variable (for example `FLASK_APP='app:create_app("configmodule")'`).
