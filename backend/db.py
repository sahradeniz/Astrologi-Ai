"""Resilient MongoDB connection utilities for the Astrologi-AI backend."""
from __future__ import annotations

import logging
import os
import time
from threading import Lock
from typing import Optional, Tuple

from pymongo import MongoClient
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

__all__ = [
    "MongoUnavailable",
    "get_mongo_client",
    "ensure_mongo_connection",
    "mongo_healthcheck",
    "close_mongo_client",
]


class MongoUnavailable(RuntimeError):
    """Raised when a stable Mongo connection cannot be established."""


_client: Optional[MongoClient] = None
_lock = Lock()
_MONGO_URI = os.getenv("MONGO_URI")


def _parse_int(key: str, default: int) -> int:
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        logger.warning("Invalid value for %s=%s; using default %s", key, value, default)
        return default


def _build_client() -> MongoClient:
    if not _MONGO_URI:
        raise MongoUnavailable("MONGO_URI is not configured.")

    options = {
        "retryWrites": True,
        "retryReads": True,
        "minPoolSize": _parse_int("MONGO_MIN_POOL_SIZE", 1),
        "maxPoolSize": _parse_int("MONGO_MAX_POOL_SIZE", 20),
        "waitQueueTimeoutMS": _parse_int("MONGO_WAIT_QUEUE_TIMEOUT_MS", 2000),
        "serverSelectionTimeoutMS": _parse_int("MONGO_SERVER_SELECTION_TIMEOUT_MS", 3000),
        "connectTimeoutMS": _parse_int("MONGO_CONNECT_TIMEOUT_MS", 5000),
        "socketTimeoutMS": _parse_int("MONGO_SOCKET_TIMEOUT_MS", 20000),
        "heartbeatFrequencyMS": _parse_int("MONGO_HEARTBEAT_FREQUENCY_MS", 10000),
        "appname": os.getenv("MONGO_APP_NAME", "astrologi-ai-backend"),
    }

    return MongoClient(_MONGO_URI, **options)


def close_mongo_client() -> None:
    """Close and clear the cached client."""
    global _client  # noqa: PLW0603 - module level cache
    with _lock:
        if _client is not None:
            try:
                _client.close()
            except Exception:  # pragma: no cover - defensive
                logger.exception("Unexpected error while closing Mongo client.")
            finally:
                _client = None


def get_mongo_client(*, revalidate: bool = False) -> MongoClient:
    """Return the shared Mongo client, optionally verifying connectivity."""
    global _client  # noqa: PLW0603 - module level cache
    if _client is None:
        with _lock:
            if _client is None:
                _client = _build_client()

    client = _client
    if revalidate:
        client.admin.command("ping")
    return client


def ensure_mongo_connection(
    *, retries: int = 3, delay: float = 1.5, revalidate: bool = True
) -> MongoClient:
    """Attempt to obtain a healthy Mongo client with retry/backoff."""
    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            client = get_mongo_client(revalidate=revalidate)
            return client
        except PyMongoError as exc:
            last_error = exc
            logger.warning("Mongo connection attempt %s/%s failed: %s", attempt, retries, exc)
            close_mongo_client()
            time.sleep(delay * attempt)

    raise MongoUnavailable(str(last_error) if last_error else "Unable to connect to MongoDB.")


def mongo_healthcheck() -> Tuple[bool, str]:
    """Return a tuple indicating Mongo availability and a human friendly message."""
    if not _MONGO_URI:
        return False, "MongoDB disabled (MONGO_URI missing)."

    try:
        ensure_mongo_connection(retries=1, delay=0.5, revalidate=True)
        return True, "Mongo connection healthy."
    except MongoUnavailable as exc:
        return False, str(exc)

