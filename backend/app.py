"""Astrologi-AI Backend MVP: Flask REST API for astrology charts."""
from __future__ import annotations

import json
import logging
logging.basicConfig(level=logging.INFO)
import os
import re
import sys
import time
import traceback
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, Sequence

import pytz
import requests
import swisseph as swe
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Ensure project root is on sys.path when running as a script.
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.archetype_engine import extract_archetype_data

load_dotenv(dotenv_path=BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")

CORS(
    app,
    origins=[origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)

EPHE_PATH = os.environ.get('EPHE_PATH', '')
try:
    swe.set_ephe_path(EPHE_PATH)
except Exception as exc:  # pragma: no cover - depends on runtime environment
    logger.error("Failed to set Swiss Ephemeris path: %s", exc)

OPENCAGE_KEY = os.getenv("OPENCAGE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.warning("⚠️ GROQ_API_KEY not found in environment.")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
}

SIGNS_TR = (
    "Koç",
    "Boğa",
    "İkizler",
    "Yengeç",
    "Aslan",
    "Başak",
    "Terazi",
    "Akrep",
    "Yay",
    "Oğlak",
    "Kova",
    "Balık",
)

ASPECTS = (
    ("Conjunction", 0, 8),
    ("Sextile", 60, 4),
    ("Square", 90, 6),
    ("Trine", 120, 6),
    ("Opposition", 180, 8),
)


@dataclass(slots=True)
class LocationData:
    latitude: float
    longitude: float
    timezone: str
    label: str


class ApiError(Exception):
    """Raised when external API requests fail."""


class AIError(Exception):
    """Raised when AI interpretation fails."""


def call_groq(messages: Sequence[Dict[str, str]], *, temperature: float = 0.6, max_tokens: int = 600) -> str:
    """Send a chat completion request to Groq and return the model response."""

    if not GROQ_API_KEY:
        raise AIError("GROQ_API_KEY yapılandırılmadı.")

    payload = {
        "model": GROQ_MODEL,
        "messages": list(messages),
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=20)
    except requests.RequestException as exc:  # pragma: no cover - network error
        raise AIError("Groq API isteği başarısız oldu.") from exc

    if response.status_code >= 400:
        raise AIError(f"Groq API hatası: {response.status_code} - {response.text}")

    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise AIError("Groq API beklenen yanıtı döndürmedi.")

    message = choices[0].get("message") or {}
    content = message.get("content", "").strip()
    if not content:
        raise AIError("Groq yanıtı boş döndü.")
    return content



def generate_ai_interpretation(chart_data: dict[str, Any] | str) -> str:
    """Call Groq Chat Completions to produce an interpretation."""

    if not GROQ_API_KEY:
        return "AI interpretation unavailable."

    if isinstance(chart_data, str):
        chart_text = chart_data
    else:
        try:
            chart_text = json.dumps(chart_data, ensure_ascii=False)
        except (TypeError, ValueError):
            chart_text = str(chart_data)

    prompt = f"You are an expert astrologer. Analyze this chart: {chart_text}"
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "You are an AI astrologer providing deep and empathetic insights.",
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result.get("choices", [{}])[0].get("message", {}).get("content", "AI interpretation unavailable.")
    except requests.RequestException as exc:
        logger.warning("Groq request failed: %s", exc)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Groq response parsing failed: %s", exc)
    return "AI interpretation unavailable."


def get_ai_interpretation(chart_data: Mapping[str, Any]) -> Dict[str, Any]:
    """Generate a rich interpretation by blending archetype themes with Groq output."""

    try:
        archetype = extract_archetype_data(chart_data)
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Archetype extraction failed: %s", exc)
        fallback_ai = {
            "headline": "Interpretation unavailable",
            "summary": "We could not generate a full interpretation at this time.",
            "advice": "Stay grounded and patient; your insight is unfolding.",
        }
        return {
            "ai_interpretation": fallback_ai,
            "themes": [],
            "tone": "balanced growth",
        }

    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", GROQ_MODEL)
    if not groq_api_key:
        logger.warning("⚠️ GROQ_API_KEY not found; cannot call Groq.")
        fallback_ai = {
            "headline": "Interpretation unavailable",
            "summary": "We could not generate a full interpretation at this time.",
            "advice": "Stay grounded and patient; your insight is unfolding.",
        }
        return {
            "ai_interpretation": fallback_ai,
            "themes": archetype.get("core_themes", []),
            "tone": archetype.get("story_tone", "balanced growth"),
        }

    core_themes = archetype.get("core_themes", [])
    tone_value = archetype.get("story_tone", "balanced growth")
    themes = ", ".join(core_themes) or "inner exploration"
    aspects = ", ".join(archetype.get("notable_aspects", [])) or "No notable aspects recorded."

    fallback_ai = {
        "headline": "Interpretation unavailable",
        "summary": "We could not generate a full interpretation at this time.",
        "advice": "Stay grounded and patient; your insight is unfolding.",
    }

    def build_result(ai_output: Dict[str, str]) -> Dict[str, Any]:
        return {
            "ai_interpretation": ai_output,
            "themes": core_themes,
            "tone": tone_value,
        }

    prompt = f"""
You are **Jovia**, an intuitive AI astrologer who blends depth psychology, mythology, and astrology.
You speak with empathy and poetic insight, not like a generic assistant.

Interpret the user's birth chart themes below.
Focus on the inner story of transformation — emotional patterns, spiritual lessons, and healing arcs.
Avoid explaining what astrology *is*; instead, *speak as if you see into their soul.*

Themes: {themes}
Tone: {tone}
Aspects: {aspects}

Return your response as a JSON object:

{{
  "headline": "a poetic title (2–5 words)",
  "summary": "a rich 3–5 paragraph interpretation written as a story — introspective, emotional, and mythic in tone",
  "advice": "one short, heartfelt sentence offering guidance"
}}
""".strip()

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": groq_model,
        "messages": [
            {"role": "system", "content": "You are an insightful, compassionate astrologer."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 400,
        "temperature": 0.8,
    }

    print("Sending to Groq with model:", groq_model)
    print("Key prefix:", groq_api_key[:8])
    payload_json = json.dumps(payload, ensure_ascii=False)
    print("Payload preview:", payload_json[:300])
    logger.debug("Groq prompt payload: %s", payload_json)

    time.sleep(0.5)

    content = ""
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print("Groq response status:", response.status_code)
        print("Groq response preview:", response.text[:500])
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") if isinstance(data, dict) else None
        if choices and isinstance(choices, list) and choices:
            message = choices[0].get("message") if isinstance(choices[0], dict) else None
            content = (message or {}).get("content", "") if isinstance(message, dict) else ""
        else:
            logger.warning("Groq response missing choices array.")
            content = ""
    except Exception as exc:  # pylint: disable=broad-except
        print("Groq API call failed:", exc)
        traceback.print_exc()
        logger.exception("Groq API call failed: %s", exc)
        return fallback

    print("RAW GROQ OUTPUT:", content)
    logger.debug("Groq content raw: %s", content)

    parsed = None
    if content:
        try:
            parsed = json.loads(content)
            print("PARSE SUCCESS:", True)
        except json.JSONDecodeError:
            print("PARSE SUCCESS:", False)
            headline_match = re.search(r"(?i)(headline|title)[:\-]\s*(.*)", content)
            summary_match = re.search(r"(?i)(summary|interpretation)[:\-]\s*(.*)", content)
            advice_match = re.search(r"(?i)(advice|guidance)[:\-]\s*(.*)", content)

            headline = headline_match.group(2).strip() if headline_match else "Interpretation unavailable"
            summary = summary_match.group(2).strip() if summary_match else content[:400].strip()
            advice = advice_match.group(2).strip() if advice_match else "Trust your own timing."

            parsed = {
                "headline": headline,
                "summary": summary,
                "advice": advice,
            }
    else:
        print("PARSE SUCCESS:", False)

    if not parsed:
        parsed = {
            "headline": "Interpretation unavailable",
            "summary": "We could not generate a full interpretation at this time.",
            "advice": "Stay grounded and patient; your insight is unfolding.",
        }

    headline = str(parsed.get("headline", "")).strip() or "Interpretation unavailable"
    summary = str(parsed.get("summary", "")).strip() or "We could not generate a full interpretation at this time."
    advice = str(parsed.get("advice", "")).strip() or "Stay grounded and patient; your insight is unfolding."

    ai_output = {
        "headline": headline,
        "summary": summary,
        "advice": advice,
    }

    return {
        "ai_interpretation": ai_output,
        "themes": archetype.get("core_themes", []),
        "tone": archetype.get("story_tone", "balanced growth"),
    }


def _request_refined_interpretation(archetype: Mapping[str, Any], chart_data: Mapping[str, Any]) -> Dict[str, str]:
    """Call Groq to craft a poetic interpretation informed by extracted themes."""

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        logger.warning("⚠️ GROQ_API_KEY not found in environment.")
        raise AIError("GROQ_API_KEY yapılandırılmadı.")

    system_prompt = (
        "You are a calm, wise, mentor-like astrologer. "
        "Study the provided natal chart context and compose a response in JSON with keys "
        "'headline', 'summary', and 'advice'. Headline must be a short poetic title in English, "
        "no more than 10 words. Summary must be exactly one paragraph that expresses the emotional and "
        "spiritual meaning of the themes in a reflective, compassionate tone. Advice must be a brief, "
        "mentor-like suggestion for personal growth."
    )

    user_payload = {
        "core_themes": archetype.get("core_themes", []),
        "story_tone": archetype.get("story_tone"),
        "notable_aspects": archetype.get("notable_aspects", []),
        "chart_data": chart_data,
    }

    user_prompt = json.dumps(user_payload, ensure_ascii=False)

    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
        }
        key_preview = (groq_api_key or "")[:10]
        print("🔮 Sending request to Groq with model:", GROQ_MODEL)
        print("🔑 Using key starts with:", key_preview)
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 400,
                "temperature": 0.8,
            },
            timeout=30,
        )
        response.raise_for_status()
        logger.info("Groq model response: %s", response.status_code)
        data = response.json()
        ai_message = data["choices"][0]["message"]["content"]
    except Exception as exc:  # pylint: disable=broad-except
        logger.warning("Groq request failed: %s", exc)
        if hasattr(exc, "response") and getattr(exc, "response") is not None:
            logger.warning("Groq error body: %s", exc.response.text)
        ai_message = "Interpretation unavailable — Groq API error."

    try:
        parsed = json.loads(ai_message)
    except json.JSONDecodeError:
        raise AIError("Groq yanıtı geçerli JSON değil.")

    headline = str(parsed.get("headline", "")).strip() or "Interpretation Unavailable"
    summary = str(parsed.get("summary", "")).strip() or "We could not generate an interpretation."
    advice = str(parsed.get("advice", "")).strip() or "Take time to reflect gently on your current path."

    return {
        "headline": headline,
        "summary": summary,
        "advice": advice,
    }

def chart_to_summary(chart: Mapping[str, Any]) -> str:
    """Convert chart data into a textual summary for the AI assistant."""

    location = chart.get("location", {})
    lines = [
        f"Konum: {location.get('city', 'Bilinmeyen')} | Zaman Dilimi: {chart.get('timezone', 'N/A')} | Doğum: {chart.get('birth_datetime', 'N/A')}",
        "Gezegenler:",
    ]

    planets = chart.get("planets", {})
    for planet, details in planets.items():
        lines.append(
            f"- {planet}: {details.get('sign', 'N/A')} burcunda, {details.get('house', '?')} evde (uzunluk {details.get('longitude')}°)"
        )

    houses = chart.get("houses")
    if isinstance(houses, list) and houses:
        lines.append("Ev Başlangıçları:" )
        lines.append(", ".join(f"Ev {idx + 1}: {angle}°" for idx, angle in enumerate(houses)))

    angles = chart.get("angles", {})
    if angles:
        lines.append(
            "Özel Açılar: "
            + ", ".join(f"{name.title()}: {value}°" for name, value in angles.items())
        )

    return '\n'.join(lines)


def generate_chart_interpretation(chart: Mapping[str, Any], *, name: str | None = None) -> str:
    """Use Groq to interpret the natal chart data."""

    summary = chart_to_summary(chart)
    user_prompt = '\n'.join(
        filter(
            None,
            [
                "Aşağıda kullanıcının doğum haritası verileri bulunuyor.",
                f"Kullanıcı adı: {name}" if name else None,
                summary,
                "Lütfen Türkçe olarak, burçların anlamlarını, gezegenlerin evlerdeki etkilerini ve dikkat edilmesi gereken noktaları içeren detaylı fakat anlaşılır bir yorum yaz.",
            ],
        )
    )

    messages: Sequence[Dict[str, str]] = (
        {"role": "system", "content": "Sen deneyimli bir astroloji yorumcususun. Açıklayıcı, empatik ve eğitici bir ton kullan."},
        {"role": "user", "content": user_prompt},
    )

    return call_groq(messages, temperature=0.7, max_tokens=700)


def generate_synastry_interpretation(chart1: Mapping[str, Any], chart2: Mapping[str, Any], aspects: Sequence[Mapping[str, Any]]) -> str:
    """Produce a relational interpretation for two charts using Groq."""

    summary = '\n'.join(
        [
            "Kişi 1 Haritası:",
            chart_to_summary(chart1),
            "",
            "Kişi 2 Haritası:",
            chart_to_summary(chart2),
            "",
            "Önemli Açılar:",
            '\n'.join(
                f"- {item.get('planet1')} & {item.get('planet2')}: {item.get('aspect')} (orb {item.get('orb')}°)"
                for item in aspects
            )
            if aspects
            else "- Paylaşılan önemli açı bulunamadı.",
        ]
    )

    messages: Sequence[Dict[str, str]] = (
        {"role": "system", "content": "Sen uzman bir sinastri yorumcususun. Dengeleyici ve sezgisel içgörüler sun."},
        {
            "role": "user",
            "content": summary + "\nLütfen ilişki dinamiklerini, güçlü ve zorlayıcı temaları Türkçe olarak açıkla.",
        },
    )

    return call_groq(messages, temperature=0.65, max_tokens=600)

def fetch_location(city: str) -> LocationData:
    if not OPENCAGE_KEY:
        raise ApiError("OPENCAGE_API_KEY not configured. Check your .env file.")
    params = {
        "q": city,
        "key": OPENCAGE_KEY,
        "language": "tr",
        "limit": 1,
        "no_annotations": 0,
    }
    try:
        response = requests.get("https://api.opencagedata.com/geocode/v1/json", params=params, timeout=10)
    except requests.RequestException as exc:
        raise ApiError("OpenCage request failed.") from exc
    if response.status_code >= 400:
        raise ApiError(f"OpenCage request failed ({response.status_code}).")
    data = response.json()
    results = data.get("results", [])
    if not results:
        raise ApiError("City not found via OpenCage.")
    first = results[0]
    geometry = first.get("geometry", {})
    timezone_info = first.get("annotations", {}).get("timezone", {})
    timezone = timezone_info.get("name")
    if not timezone:
        raise ApiError("Timezone information missing from OpenCage response.")
    return LocationData(
        latitude=float(geometry.get("lat")),
        longitude=float(geometry.get("lng")),
        timezone=str(timezone),
        label=first.get("formatted") or city,
    )



def parse_birth_datetime_components(date_value: str, time_value: str | None, timezone_name: str) -> tuple[datetime, datetime]:
    """Build a datetime from separate date/time fields and convert to UTC."""

    if not isinstance(date_value, str) or not date_value.strip():
        raise ValueError("birth date must be provided as string.")

    date_str = date_value.strip()
    try:
        year, month, day = [int(part) for part in date_str.split("-")]
    except ValueError as exc:
        raise ValueError("birth date must be in YYYY-MM-DD format.") from exc

    hour = 12
    minute = 0
    if time_value:
        try:
            hour_str, minute_str = time_value.strip().split(":", 1)
            hour = int(hour_str)
            minute = int(minute_str)
        except ValueError as exc:
            raise ValueError("birth time must be in HH:MM format.") from exc

    try:
        tz = pytz.timezone(timezone_name)
    except pytz.UnknownTimeZoneError as exc:
        raise ValueError(f"Unknown timezone '{timezone_name}'.") from exc

    local_naive = datetime(year, month, day, hour, minute)
    local_dt = tz.localize(local_naive)
    utc_dt = local_dt.astimezone(pytz.utc)
    return local_dt, utc_dt


def parse_birth_datetime(birth_str: str, timezone_name: str) -> tuple[datetime, datetime]:
    """Parse the provided datetime string and convert it using the location timezone."""

    if not isinstance(birth_str, str):
        raise ValueError("birth_date must be provided as string.")

    raw = birth_str.strip()
    if not raw:
        raise ValueError("birth_date is required.")

    parsed: datetime | None = None

    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        pass

    if parsed is None:
        normalized = raw.replace('T', ' ').rstrip('Z').strip()
        for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
            if _can_parse(normalized, fmt):
                parsed = datetime.strptime(normalized, fmt)
                break

    if parsed is None:
        raise ValueError("birth_date must match ISO format (YYYY-MM-DDTHH:MM) or 'YYYY-MM-DD HH:MM'.")

    try:
        tz = pytz.timezone(timezone_name)
    except pytz.UnknownTimeZoneError as exc:
        raise ValueError(f"Unknown timezone '{timezone_name}'.") from exc

    if parsed.tzinfo is not None:
        local_dt = parsed.astimezone(tz)
    else:
        local_dt = tz.localize(parsed)

    utc_dt = local_dt.astimezone(pytz.utc)
    return local_dt, utc_dt


def _can_parse(value: str, fmt: str) -> bool:
    try:
        datetime.strptime(value, fmt)
        return True
    except ValueError:
        return False


def julian_day(utc_dt: datetime) -> float:
    ut = utc_dt.hour + utc_dt.minute / 60 + utc_dt.second / 3600
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, ut, swe.GREG_CAL)


def calc_planets(jd_ut: float, cusps: Sequence[float] | None = None) -> Dict[str, Dict[str, Any]]:
    """Calculate planetary longitudes with safe unpacking and metadata."""

    planets: Dict[str, Dict[str, Any]] = {}
    planet_codes = {
        "Sun": swe.SUN,
        "Moon": swe.MOON,
        "Mercury": swe.MERCURY,
        "Venus": swe.VENUS,
        "Mars": swe.MARS,
        "Jupiter": swe.JUPITER,
        "Saturn": swe.SATURN,
        "Uranus": swe.URANUS,
        "Neptune": swe.NEPTUNE,
        "Pluto": swe.PLUTO,
    }

    def resolve_house(longitude: float) -> int | None:
        if not cusps or len(cusps) < 2:
            return None
        lon_val = longitude % 360
        for idx in range(1, min(len(cusps), 13)):
            start = cusps[idx] % 360
            end = cusps[1] % 360 if idx == 12 else cusps[idx + 1] % 360
            if start <= end:
                if start <= lon_val < end:
                    return idx
            else:
                if lon_val >= start or lon_val < end:
                    return idx
        return None

    for planet_name, planet_id in planet_codes.items():
        try:
            result = swe.calc_ut(jd_ut, planet_id)

            values = result[0] if isinstance(result[0], (list, tuple)) else result

            lon = values[0] if len(values) > 0 else None
            lat = values[1] if len(values) > 1 else None
            dist = values[2] if len(values) > 2 else None
            speed = values[3] if len(values) > 3 else None

            lon_float = float(lon) if lon is not None else None
            lat_float = float(lat) if lat is not None else None
            dist_float = float(dist) if dist is not None else None
            speed_float = float(speed) if speed is not None else None

            house = resolve_house(lon_float) if lon_float is not None else None

            planets[planet_name] = {
                "longitude": round(lon_float % 360, 2) if lon_float is not None else None,
                "latitude": round(lat_float, 2) if lat_float is not None else None,
                "distance": round(dist_float, 4) if dist_float is not None else None,
                "speed": round(speed_float, 4) if speed_float is not None else None,
                "sign": get_zodiac_sign(lon_float) if lon_float is not None else None,
                "house": house,
            }

            if planet_name == "Sun" and lon_float is not None:
                logger.info(
                    "☀️ Sun calculated successfully → lon=%.4f, lat=%s, dist=%s, speed=%s",
                    lon_float,
                    f"{lat_float:.4f}" if lat_float is not None else "None",
                    f"{dist_float:.4f}" if dist_float is not None else "None",
                    speed_float,
                )

        except Exception as e:
            logger.warning("Failed to calculate %s: %s", planet_name, e)

    return planets


def calc_houses(jd_ut: float, latitude: float, longitude: float) -> tuple[list[float], Dict[str, float]]:
    """Calculate Placidus houses and ensure ASC–House 1 alignment."""
    # Swiss Ephemeris expects east longitudes as negative
    if longitude > 0:
        logger.info(f"Longitude {longitude}°E detected — converting to negative for Swiss Ephemeris.")
        longitude = -longitude

    # Calculate Placidus houses
    cusps, ascmc = swe.houses(jd_ut, latitude, longitude, b"P")
    houses = [round(angle % 360, 4) for angle in cusps[:12]]
    angles = {
        "ascendant": round(ascmc[0] % 360, 4),
        "midheaven": round(ascmc[1] % 360, 4),
    }

    # Sanity check for ASC alignment
    delta = abs(houses[0] - angles["ascendant"])
    logger.info(f"ASC={angles['ascendant']}°, House1={houses[0]}°, Δ={delta:.2f}°")

    # If difference > 5°, rotate houses so ASC and 1st house match
    if delta > 5:
        logger.warning(f"ASC misalignment detected ({delta:.2f}°) → correcting houses.")
        shift = (angles["ascendant"] - houses[0]) % 360
        houses = [(h + shift) % 360 for h in houses]

    return houses, angles


def assign_houses(planets: Mapping[str, Dict[str, Any]], cusps: Iterable[float]) -> None:
    cusp_list = list(cusps)[:12]
    for planet_data in planets.values():
        longitude = planet_data["longitude"]
        planet_data["house"] = determine_house(longitude, cusp_list)


def determine_house(longitude: float, cusps: list[float]) -> int:
    lon = longitude % 360
    for idx in range(12):
        start = cusps[idx] % 360
        end = cusps[(idx + 1) % 12] % 360
        if start <= end:
            if start <= lon < end:
                return idx + 1
        else:  # wrap around 360°
            if lon >= start or lon < end:
                return idx + 1
    return 12





def get_zodiac_sign(longitude: float) -> str:
    """Return zodiac sign name for a given longitude."""

    signs = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    index = int((longitude % 360) / 30)
    return signs[index % 12]

def extract_birth_inputs(payload: Mapping[str, Any]) -> tuple[str, str, str] | tuple[str, str, None]:
    """Extract city and birth date/time components from request payload."""

    city_candidate = (
        payload.get("city")
        or payload.get("birthCity")
        or payload.get("birth_location")
        or payload.get("birthLocation")
        or payload.get("location")
    )
    if isinstance(city_candidate, Mapping):
        city_candidate = (
            city_candidate.get("name")
            or city_candidate.get("label")
            or city_candidate.get("city")
            or city_candidate.get("value")
        )
    city = str(city_candidate).strip() if city_candidate else ""

    date_value = (
        payload.get("birthDate")
        or payload.get("birth_date")
        or payload.get("date")
        or payload.get("birthdate")
    )
    time_value = (
        payload.get("birthTime")
        or payload.get("time")
        or payload.get("birth_time")
    )
    datetime_candidate = (
        payload.get("birthDateTime")
        or payload.get("birth_datetime")
        or payload.get("birthDateTimeLocal")
        or payload.get("datetime")
    )

    if not city:
        raise ValueError("city is required.")

    if datetime_candidate:
        return city, str(datetime_candidate).strip(), None

    if not date_value:
        raise ValueError("birth date is required.")

    return city, str(date_value).strip(), str(time_value).strip() if time_value else None


def build_natal_chart(payload: Mapping[str, Any]) -> Dict[str, Any]:
    city, date_value, time_value = extract_birth_inputs(payload)

    location = fetch_location(city)
    local_dt, utc_dt = parse_birth_datetime_components(date_value, time_value, location.timezone)
    jd_ut = julian_day(utc_dt)

    cusps, ascmc = swe.houses(jd_ut, location.latitude, location.longitude)

    planets: Dict[str, Dict[str, Any]] = calc_planets(jd_ut, cusps)

    houses: Dict[str, Any] = {}
    try:
        cusp_count = len(cusps)
        for i in range(1, min(cusp_count, 13)):
            houses[str(i)] = round(cusps[i], 4)
    except Exception as exc:
        print("Failed to calculate houses:", exc)
        houses = {"error": str(exc)}

    angles = {
        "ascendant": round(ascmc[0] % 360, 4),
        "midheaven": round(ascmc[1] % 360, 4),
    }

    # Aspects
    aspect_definitions = [
        ("Conjunction", 0, 8),
        ("Sextile", 60, 6),
        ("Square", 90, 6),
        ("Trine", 120, 6),
        ("Opposition", 180, 8),
    ]
    aspects: list[Dict[str, Any]] = []
    planet_items = [
        (name, data["longitude"])
        for name, data in planets.items()
        if "longitude" in data
    ]
    for i in range(len(planet_items)):
        for j in range(i + 1, len(planet_items)):
            name_a, lon_a = planet_items[i]
            name_b, lon_b = planet_items[j]
            diff = abs(lon_a - lon_b)
            diff = diff if diff <= 180 else 360 - diff
            for aspect_name, aspect_angle, orb in aspect_definitions:
                if abs(diff - aspect_angle) <= orb:
                    aspects.append(
                        {
                            "planet1": name_a,
                            "planet2": name_b,
                            "aspect": aspect_name,
                            "exact_angle": round(diff, 2),
                        }
                    )
                    break

    return {
        "location": {
            "city": location.label,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "timezone": location.timezone,
        },
        "birth_datetime": local_dt.isoformat(),
        "timezone": location.timezone,
        "planets": planets,
        "houses": houses,
        "angles": angles,
        "aspects": aspects,
    }


def diff_angle(lon1: float, lon2: float) -> float:
    diff = abs(lon1 - lon2) % 360
    return diff if diff <= 180 else 360 - diff


def calculate_aspects(planets_a: Mapping[str, Dict[str, Any]], planets_b: Mapping[str, Dict[str, Any]]) -> list[Dict[str, Any]]:
    aspects: list[Dict[str, Any]] = []
    for name_a, data_a in planets_a.items():
        for name_b, data_b in planets_b.items():
            difference = diff_angle(data_a["longitude"], data_b["longitude"])
            for aspect_name, angle, orb in ASPECTS:
                if abs(difference - angle) <= orb:
                    aspects.append(
                        {
                            "planet1": name_a,
                            "planet2": name_b,
                            "aspect": aspect_name,
                            "orb": round(abs(difference - angle), 2),
                        }
                    )
                    break
    return aspects


def _handle_natal_chart_request():
    try:
        payload = request.get_json(force=True) or {}
        chart = build_natal_chart(payload)
        summary = chart_to_summary(chart)
        chart["interpretation"] = generate_ai_interpretation(summary)
    except ApiError as exc:
        logger.error("External API error: %s", exc)
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Failed to calculate natal chart")
        return jsonify({"error": str(exc)}), 400
    return jsonify(chart)


def _handle_synastry_request():
    try:
        payload = request.get_json(force=True) or {}
        person1 = payload.get("person1")
        person2 = payload.get("person2")
        if not isinstance(person1, Mapping) or not isinstance(person2, Mapping):
            raise ValueError("person1 and person2 must be objects containing birth date and city information.")
        chart1 = build_natal_chart(person1)
        chart2 = build_natal_chart(person2)
        aspects = calculate_aspects(chart1["planets"], chart2["planets"])
        response = {
            "person1": chart1,
            "person2": chart2,
            "aspects": aspects,
        }
        if GROQ_API_KEY:
            try:
                response["interpretation"] = generate_synastry_interpretation(chart1, chart2, aspects)
            except AIError as exc:
                logger.warning("Synastry interpretation failed: %s", exc)
                response["interpretation_error"] = str(exc)
    except ApiError as exc:
        logger.error("External API error: %s", exc)
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Failed to calculate synastry")
        return jsonify({"error": str(exc)}), 400
    return jsonify(response)


def _handle_chat_request():
    try:
        payload = request.get_json(force=True) or {}
        message = str(payload.get("message", "")).strip()
        if not message:
            raise ValueError("message alanı gerekli.")

        history = []
        raw_history = payload.get("history")
        if isinstance(raw_history, list):
            for item in raw_history:
                if not isinstance(item, Mapping):
                    continue
                role = item.get("role")
                content = item.get("content")
                if role in {"user", "assistant"} and isinstance(content, str):
                    history.append({"role": role, "content": content})

        system_messages = [
            {
                "role": "system",
                "content": "Sen Astrologi-AI adlı kozmik rehbersin. Türkçe yanıt ver, kullanıcıya empatik ve açıklayıcı bir tavırla yaklaş.",
            }
        ]

        chart_context = payload.get("chart")
        if isinstance(chart_context, Mapping):
            system_messages.append(
                {
                    "role": "system",
                    "content": "Kullanıcı doğum haritası verileri:\n" + chart_to_summary(chart_context),
                }
            )

        messages = [*system_messages, *history, {"role": "user", "content": message}]
        temperature = float(payload.get("temperature", 0.6))
        max_tokens = int(payload.get("maxTokens", 600))
        reply = call_groq(messages, temperature=temperature, max_tokens=max_tokens)
        return jsonify({"reply": reply})
    except AIError as exc:
        logger.error("AI chat error: %s", exc)
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Failed to process chat message")
        return jsonify({"error": str(exc)}), 400


@app.route("/interpretation", methods=["POST", "OPTIONS"])
def interpretation():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True)
    if not isinstance(payload, Mapping):
        logger.warning("Interpretation endpoint received invalid JSON payload: %s", payload)
        return jsonify({"error": "Invalid JSON payload."}), 400

    chart_data = payload.get("chart_data")
    if not isinstance(chart_data, Mapping):
        logger.warning("Interpretation endpoint missing chart_data: %s", chart_data)
        return jsonify({"error": "chart_data must be provided as an object."}), 400

    chart_dict = dict(chart_data)

    try:
        archetype = extract_archetype_data(chart_dict)
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Failed to extract archetype data")
        return jsonify({"error": "Failed to extract archetype data."}), 500

    def _default_fallback() -> Dict[str, str]:
        return {
            "headline": "Interpretation unavailable",
            "summary": "We could not generate an interpretation at this time.",
            "advice": "Return to grounding practices until clarity returns.",
        }

    try:
        ai_result = _request_refined_interpretation(archetype, chart_dict)
    except AIError as exc:
        logger.error("Groq interpretation error: %s", exc)
        ai_result = get_ai_interpretation(chart_dict)
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Unexpected interpretation failure")
        ai_result = get_ai_interpretation(chart_dict)

    response_body = {
        "themes": archetype.get("core_themes", []),
        "ai_interpretation": ai_result,
        "tone": archetype.get("story_tone"),
    }

    return jsonify(response_body), 200


@app.route("/api/calculate-natal-chart", methods=["POST", "OPTIONS"])
def api_calculate_natal_chart():
    if request.method == "OPTIONS":
        return "", 204
    return _handle_natal_chart_request()


@app.route("/natal-chart", methods=["POST", "OPTIONS"])
def public_natal_chart():
    if request.method == "OPTIONS":
        return "", 204
    return _handle_natal_chart_request()


@app.route("/api/calculate-synastry", methods=["POST", "OPTIONS"])
def api_calculate_synastry():
    if request.method == "OPTIONS":
        return "", 204
    return _handle_synastry_request()


@app.route("/calculate_synastry_chart", methods=["POST", "OPTIONS"])
def public_calculate_synastry():
    if request.method == "OPTIONS":
        return "", 204
    return _handle_synastry_request()


@app.route("/api/chat/message", methods=["POST", "OPTIONS"])
def api_chat_message():
    if request.method == "OPTIONS":
        return "", 204
    return _handle_chat_request()


@app.route("/chat/message", methods=["POST", "OPTIONS"])
def public_chat_message():
    if request.method == "OPTIONS":
        return "", 204
    return _handle_chat_request()


@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple endpoint to confirm backend is alive."""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
