"""Utility helpers for horoscope generation."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ZodiacRange:
    """Simple dataclass describing a zodiac range."""

    start: tuple[int, int]
    end: tuple[int, int]
    name: str


_ZODIAC_RANGES: tuple[ZodiacRange, ...] = (
    ZodiacRange((3, 21), (4, 19), "Koç"),
    ZodiacRange((4, 20), (5, 20), "Boğa"),
    ZodiacRange((5, 21), (6, 21), "İkizler"),
    ZodiacRange((6, 22), (7, 22), "Yengeç"),
    ZodiacRange((7, 23), (8, 22), "Aslan"),
    ZodiacRange((8, 23), (9, 22), "Başak"),
    ZodiacRange((9, 23), (10, 23), "Terazi"),
    ZodiacRange((10, 24), (11, 22), "Akrep"),
    ZodiacRange((11, 23), (12, 21), "Yay"),
    ZodiacRange((12, 22), (12, 31), "Oğlak"),
    ZodiacRange((1, 1), (1, 19), "Oğlak"),
    ZodiacRange((1, 20), (2, 18), "Kova"),
    ZodiacRange((2, 19), (3, 20), "Balık"),
)


def determine_zodiac_sign(birthdate: date | None) -> str | None:
    """Return the western zodiac sign for a given birthdate."""

    if not birthdate:
        return None

    month, day = birthdate.month, birthdate.day

    for zodiac in _ZODIAC_RANGES:
        start_month, start_day = zodiac.start
        end_month, end_day = zodiac.end
        if (month == start_month and day >= start_day) or (
            month == end_month and day <= end_day
        ):
            return zodiac.name

    return None


def build_horoscope_message(name: str, zodiac_sign: str | None) -> str:
    """Craft a short horoscope message using the provided details."""

    base_intro = (
        f"Merhaba {name}! Kozmik enerjiler bugün senin etrafında dönüyor. "
    )

    if zodiac_sign:
        sign_line = (
            f"Bir {zodiac_sign} olarak sezgilerine güven ve ilhamını paylaş. "
        )
    else:
        sign_line = "Bugün iç sesin sana rehberlik edecek, kalbini dinle. "

    closing = "Küçük de olsa cesur bir adım atmak için harika bir gün."

    return base_intro + sign_line + closing
