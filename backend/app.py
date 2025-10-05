"""Astrologi-AI Backend MVP: Flask REST API for astrology charts."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, Mapping, Sequence

import pytz
import requests
import swisseph as swe
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

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

OPENCAGE_KEY = os.environ.get("OPENCAGE_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama3-8b")
GROQ_API_URL = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

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


def calc_planets(jd_ut: float) -> Dict[str, Dict[str, Any]]:
    positions: Dict[str, Dict[str, Any]] = {}
    for name, code in PLANETS.items():
        lon, lat, _, speed = swe.calc_ut(jd_ut, code)
        lon = lon % 360
        sign_index = int(lon // 30)
        positions[name] = {
            "longitude": round(lon, 4),
            "latitude": round(lat, 4),
            "sign": SIGNS_TR[sign_index],
            "retrograde": speed < 0,
        }
    return positions


def calc_houses(jd_ut: float, latitude: float, longitude: float) -> tuple[list[float], Dict[str, float]]:
    cusps, ascmc = swe.houses(jd_ut, latitude, longitude)
    houses = [round(angle % 360, 4) for angle in cusps[:12]]
    angles = {
        "ascendant": round(ascmc[0] % 360, 4),
        "midheaven": round(ascmc[1] % 360, 4),
    }
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



def extract_birth_inputs(payload: Mapping[str, Any]) -> tuple[str, str]:
    """Extract city name and datetime string from request payload."""

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

    datetime_candidate = (
        payload.get("birth_date")
        or payload.get("birthDate")
        or payload.get("birthDateTime")
        or payload.get("birth_datetime")
        or payload.get("birthDateTimeLocal")
        or payload.get("datetime")
        or payload.get("birthdate")
    )

    if not datetime_candidate:
        date_part = payload.get("birthDate") or payload.get("birthdate") or payload.get("date")
        time_part = payload.get("birthTime") or payload.get("time")
        if date_part and time_part:
            datetime_candidate = f"{date_part} {time_part}"

    birth_value = str(datetime_candidate).strip() if datetime_candidate else ""

    if not city:
        raise ValueError("city is required.")
    if not birth_value:
        raise ValueError("birth_date is required.")

    return city, birth_value

def build_natal_chart(payload: Mapping[str, Any]) -> Dict[str, Any]:
    city, birth_value = extract_birth_inputs(payload)

    location = fetch_location(city)
    local_dt, utc_dt = parse_birth_datetime(birth_value, location.timezone)
    jd_ut = julian_day(utc_dt)

    planets = calc_planets(jd_ut)
    houses, angles = calc_houses(jd_ut, location.latitude, location.longitude)
    assign_houses(planets, houses)

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
        name = payload.get("name") or payload.get("fullName")
        if GROQ_API_KEY:
            try:
                chart["interpretation"] = generate_chart_interpretation(chart, name=name)
            except AIError as exc:
                logger.warning("AI interpretation failed: %s", exc)
                chart["interpretation_error"] = str(exc)
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
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
