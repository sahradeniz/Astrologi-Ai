"""Tests for the external astrology service proxy endpoints."""
from __future__ import annotations

import json

import pytest


class DummyResponse:
    """Simple response stub mimicking the interface of ``requests.Response``."""

    def __init__(
        self,
        *,
        status_code: int = 200,
        json_data: dict | None = None,
        text: str = "",
    ) -> None:
        self.status_code = status_code
        self._json_data = json_data
        self.text = text
        self.ok = status_code < 400

        if json_data is None:
            self.content = b""
        else:
            self.content = json.dumps(json_data).encode("utf-8")

    def json(self):  # noqa: D401 - mirrors requests.Response
        if self._json_data is None:
            raise ValueError("No JSON payload available")
        return self._json_data


@pytest.mark.parametrize(
    ("route", "expected_url"),
    (
        ("/api/calculate-natal-chart", "https://astro.example/calculate_natal_chart"),
        ("/api/calculate-synastry", "https://astro.example/api/calculate-synastry"),
        ("/api/calculate-transits", "https://astro.example/api/calculate-transits"),
        ("/api/chat/message", "https://astro.example/api/chat/message"),
    ),
)
def test_proxy_endpoints_forward_payload(monkeypatch, client, route, expected_url):
    app = client.application
    app.config.update(
        ASTROLOGY_API_BASE_URL="https://astro.example",
        ASTROLOGY_API_KEY="secret-token",
        ASTROLOGY_API_TIMEOUT=7.5,
    )
    app.config.pop("_ASTROLOGY_API_CLIENT", None)

    captured: dict[str, object] = {}

    def fake_post(url, json, headers, timeout):  # type: ignore[override]
        captured.update({
            "url": url,
            "json": json,
            "headers": headers,
            "timeout": timeout,
        })
        return DummyResponse(json_data={"result": "ok"})

    monkeypatch.setattr("app.external_api.requests.post", fake_post)

    response = client.post(route, json={"foo": "bar"})

    assert response.status_code == 200
    assert response.get_json() == {"result": "ok"}
    assert captured["url"] == expected_url
    assert captured["json"] == {"foo": "bar"}
    assert captured["headers"] == {
        "Accept": "application/json",
        "Authorization": "Bearer secret-token",
    }
    assert captured["timeout"] == pytest.approx(7.5)


def test_proxy_returns_empty_object_on_blank_payload(monkeypatch, client):
    app = client.application
    app.config.update(ASTROLOGY_API_BASE_URL="https://astro.example")
    app.config.pop("_ASTROLOGY_API_CLIENT", None)

    monkeypatch.setattr(
        "app.external_api.requests.post",
        lambda *args, **kwargs: DummyResponse(json_data=None),
    )

    response = client.post("/api/calculate-natal-chart", json={})

    assert response.status_code == 200
    assert response.get_json() == {}


def test_proxy_raises_bad_request_on_upstream_error(monkeypatch, client):
    app = client.application
    app.config.update(ASTROLOGY_API_BASE_URL="https://astro.example")
    app.config.pop("_ASTROLOGY_API_CLIENT", None)

    error_payload = {"error": "Kozmik bir hata oluştu."}

    monkeypatch.setattr(
        "app.external_api.requests.post",
        lambda *args, **kwargs: DummyResponse(status_code=400, json_data=error_payload),
    )

    response = client.post("/api/calculate-natal-chart", json={})

    assert response.status_code == 400
    assert response.get_json() == error_payload


def test_proxy_returns_service_unavailable_when_not_configured(client):
    app = client.application
    app.config.update(ASTROLOGY_API_BASE_URL="")
    app.config.pop("_ASTROLOGY_API_CLIENT", None)

    response = client.post("/api/calculate-natal-chart", json={})

    assert response.status_code == 503
    assert response.get_json() == {"error": "Harici astroloji servisi yapılandırılmadı."}
