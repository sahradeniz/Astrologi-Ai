"""Unit tests for horoscope utilities and API."""
from __future__ import annotations

from datetime import date

import pytest

from app.horoscope import build_horoscope_message, determine_zodiac_sign


@pytest.mark.parametrize(
    ("birthdate", "expected"),
    [
        (date(2023, 3, 21), "Koç"),
        (date(2023, 4, 20), "Boğa"),
        (date(2023, 6, 30), "Yengeç"),
        (date(2023, 11, 29), "Yay"),
        (date(2023, 2, 1), "Kova"),
    ],
)
def test_determine_zodiac_sign(birthdate, expected):
    assert determine_zodiac_sign(birthdate) == expected


def test_determine_zodiac_sign_without_birthdate():
    assert determine_zodiac_sign(None) is None


@pytest.mark.parametrize(
    ("zodiac", "snippet"),
    [
        ("Boğa", "Bir Boğa olarak"),
        (None, "iç sesin"),
    ],
)
def test_build_horoscope_message_contains_sign_snippet(zodiac, snippet):
    message = build_horoscope_message("Ada", zodiac)
    assert snippet in message


def test_horoscope_endpoint_success(client):
    response = client.post(
        "/api/horoscope",
        json={"name": "Ada", "birthdate": "1990-04-05"},
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["zodiacSign"] == "Koç"
    assert "message" in data


def test_horoscope_endpoint_validation_error(client):
    response = client.post("/api/horoscope", json={"birthdate": "1990-04-05"})

    assert response.status_code == 400
    data = response.get_json()
    assert "ismini" in data["error"].lower()


def test_horoscope_endpoint_invalid_date(client):
    response = client.post(
        "/api/horoscope",
        json={"name": "Ada", "birthdate": "1990-13-01"},
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "geçersiz" in data["error"].lower()
