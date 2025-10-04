"""WSGI entry point exposing the Flask app for Render and gunicorn."""
from __future__ import annotations

import os

from . import create_app

app = create_app()


def _resolve_port(default: int = 5000) -> int:
    """Pick the port from the PORT env var or fall back to ``default``."""

    try:
        return int(os.environ.get("PORT", default))
    except (TypeError, ValueError):  # pragma: no cover - defensive guard
        return default


if __name__ == "__main__":
    port = _resolve_port()
    app.run(host="0.0.0.0", port=port)
