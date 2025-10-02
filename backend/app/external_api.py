"""Client helpers for interacting with the external astrology service."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping
from urllib.parse import urljoin

import requests
from requests import Response


class ExternalServiceError(RuntimeError):
    """Raised when the upstream astrology service reports an error."""


@dataclass(slots=True)
class AstrologyApiClient:
    """Thin wrapper around the remote astrology API."""

    base_url: str
    api_key: str | None = None
    timeout: float = 10.0

    def __post_init__(self) -> None:
        base = self.base_url.strip()
        if not base:
            raise ValueError("Astroloji servisi temel adresi gerekli.")
        self.base_url = base.rstrip("/") + "/"

    def post(self, path: str, payload: Mapping[str, Any] | None = None) -> Any:
        """Send a POST request to the given API path and return the JSON body."""

        url = urljoin(self.base_url, path.lstrip("/"))
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        response = requests.post(
            url,
            json=dict(payload or {}),
            headers=headers,
            timeout=self.timeout,
        )

        self._raise_for_status(response)

        if not response.content:
            return None

        try:
            return response.json()
        except ValueError as exc:  # pragma: no cover - defensive guard
            raise ExternalServiceError("Servisten JSON çıktısı bekleniyordu.") from exc

    @staticmethod
    def _raise_for_status(response: Response) -> None:
        if response.ok:
            return

        message: str | None = None

        try:
            payload = response.json()
        except ValueError:
            payload = None

        if isinstance(payload, dict):
            message = (
                payload.get("error")
                or payload.get("message")
                or payload.get("detail")
            )

        if not message:
            message = response.text.strip() or "Harici astroloji servisi hata döndürdü."

        raise ExternalServiceError(message)

