"""Configuration objects for the Flask application."""
from __future__ import annotations

from dataclasses import dataclass


def _get_env(key: str, default: str | None = None) -> str | None:
    """Fetch environment variables with an optional default."""

    import os

    return os.environ.get(key, default)


@dataclass(slots=True)
class BaseConfig:
    """Base configuration shared across environments."""

    DEBUG: bool = False
    TESTING: bool = False
    SECRET_KEY: str = _get_env("SECRET_KEY", "change-me") or "change-me"


@dataclass(slots=True)
class DevelopmentConfig(BaseConfig):
    """Configuration tailored for local development."""

    DEBUG: bool = True


@dataclass(slots=True)
class ProductionConfig(BaseConfig):
    """Production configuration with default hardening."""

    pass
