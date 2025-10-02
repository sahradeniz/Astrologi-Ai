"""Pytest fixtures for the backend."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture()
def client():
    """Return a Flask test client for the API."""

    app = create_app()
    app.config.update(TESTING=True)

    with app.test_client() as client:
        yield client
