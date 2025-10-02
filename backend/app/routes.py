"""Route handlers for the Flask backend."""
from __future__ import annotations

from datetime import date

from flask import Blueprint, current_app, jsonify, request
from werkzeug.exceptions import BadRequest, ServiceUnavailable

from .horoscope import build_horoscope_message, determine_zodiac_sign
from .external_api import AstrologyApiClient, ExternalServiceError

api_blueprint = Blueprint("api", __name__)


def _parse_request_payload() -> dict:
    payload = request.get_json(silent=True)
    if payload is None:
        raise BadRequest("Geçerli bir JSON gövdesi sağlamalısın.")
    return payload


def _get_astrology_client() -> AstrologyApiClient:
    app = current_app
    cached_client = app.config.get("_ASTROLOGY_API_CLIENT")
    if isinstance(cached_client, AstrologyApiClient):
        return cached_client

    base_url = str(app.config.get("ASTROLOGY_API_BASE_URL", "") or "").strip()
    if not base_url:
        raise ServiceUnavailable("Harici astroloji servisi yapılandırılmadı.")

    api_key = app.config.get("ASTROLOGY_API_KEY")
    timeout_raw = app.config.get("ASTROLOGY_API_TIMEOUT", 10.0)
    try:
        timeout = float(timeout_raw)
    except (TypeError, ValueError):  # pragma: no cover - defensive guard
        timeout = 10.0

    client = AstrologyApiClient(base_url=base_url, api_key=api_key, timeout=timeout)
    app.config["_ASTROLOGY_API_CLIENT"] = client
    return client


def _proxy_external_post(path: str, payload: dict):
    try:
        data = _get_astrology_client().post(path, payload)
    except ExternalServiceError as exc:
        raise BadRequest(str(exc)) from exc

    if data is None:
        return jsonify({})

    return jsonify(data)


@api_blueprint.post("/horoscope")
def get_horoscope():
    """Generate a playful horoscope response based on user input."""

    payload = _parse_request_payload()

    name = str(payload.get("name", "")).strip()
    if not name:
        raise BadRequest("Lütfen ismini belirt.")

    birthdate_str = payload.get("birthdate")

    if birthdate_str is not None and not isinstance(birthdate_str, str):
        raise BadRequest("Doğum tarihi metin formatında (YYYY-MM-DD) olmalı.")

    try:
        birthdate = date.fromisoformat(birthdate_str) if birthdate_str else None
    except ValueError as exc:  # pragma: no cover - handled below
        raise BadRequest("Geçersiz doğum tarihi formatı. YYYY-MM-DD kullan.") from exc

    zodiac_sign = determine_zodiac_sign(birthdate)

    message = build_horoscope_message(name, zodiac_sign)

    return jsonify(
        {
            "name": name,
            "birthdate": birthdate_str,
            "zodiacSign": zodiac_sign,
            "message": message,
        }
    )


@api_blueprint.post("/calculate-natal-chart")
def calculate_natal_chart():
    payload = _parse_request_payload()
    return _proxy_external_post("/calculate_natal_chart", payload)


@api_blueprint.post("/calculate-synastry")
def calculate_synastry():
    payload = _parse_request_payload()
    return _proxy_external_post("/api/calculate-synastry", payload)


@api_blueprint.post("/calculate-transits")
def calculate_transits():
    payload = _parse_request_payload()
    return _proxy_external_post("/api/calculate-transits", payload)


@api_blueprint.post("/chat/message")
def send_chat_message():
    payload = _parse_request_payload()
    return _proxy_external_post("/api/chat/message", payload)
