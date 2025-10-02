"""Route handlers for the Flask backend."""
from __future__ import annotations

from datetime import date

from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest

from .horoscope import build_horoscope_message, determine_zodiac_sign

api_blueprint = Blueprint("api", __name__)


def _parse_request_payload() -> dict:
    payload = request.get_json(silent=True)
    if payload is None:
        raise BadRequest("Geçerli bir JSON gövdesi sağlamalısın.")
    return payload


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
