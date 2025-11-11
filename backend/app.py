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
try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    def load_dotenv(*_args, **_kwargs):
        return False
try:
    from pymongo import ReturnDocument
except ImportError:  # pragma: no cover - optional dependency
    class ReturnDocument:
        AFTER = "after"

# Ensure project root is on sys.path when running as a script.
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

load_dotenv(dotenv_path=BASE_DIR / ".env")

from backend.archetype_engine import (
    clean_text,
    extract_archetype_data,
    generate_full_archetype_report,
    integrate_life_expression,
    limit_sentences,
    map_confidence_label,
    pick_axis,
)
from backend.db import MongoUnavailable, ensure_mongo_connection, mongo_healthcheck

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")

CORS(
    app,
    origins=[origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "OPTIONS"],
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
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "astrologi_ai")
PROFILE_COLLECTION_NAME = os.getenv("MONGO_PROFILE_COLLECTION", "profiles")

if MONGO_URI:
    try:
        ensure_mongo_connection(retries=2, delay=0.8, revalidate=True)
        logger.info("MongoDB bağlantısı başarıyla kuruldu.")
    except MongoUnavailable as exc:
        logger.warning("MongoDB başlangıç bağlantısı kurulamadı: %s", exc)
else:
    logger.info("MONGO_URI tanımlı değil; MongoDB bağlantısı devre dışı bırakıldı.")

AI_PROMPT = """
Sen bir psikolojik astrolog, sezgisel yazar ve içgörü rehberisin.  
Görevin, kullanıcıya doğum haritasındaki temayı sade, derin ve insani biçimde aktarmaktır.  
Her yorum kişiye özel bir içsel farkındalık alanı açmalı; öğretici değil, hissedilir olmalıdır.

Yazım tarzı rehberi:
- Türkçe yaz.  
- Teknik terimleri (örneğin: Merkür, kare, trine, ev, eksen, transit) kullanma.  
- Onların anlamını sezgisel veya insani biçimde aktar (örneğin "zihinsel yoğunluk", "duygularını paylaşmakta zorlanma", "denge kurma ihtiyacı").  
- Kullanıcıya doğrudan “sen” diyerek hitap et.  
- Cümleler kısa ve doğal olmalı; paragraflar duygusal akış hissi taşımalı.  
- Fazla spiritüel klişelerden, yapay motivasyon cümlelerinden, emoji ve sembollerden kaçın.  
- Metin duygusal olarak sıcak, anlatı olarak net, ton olarak profesyonel olmalı.  

Anlatı yapısı:
1️⃣ Ana Yorum (3–6 cümle) → Bu temanın kullanıcı üzerindeki genel etkisini anlat.  
2️⃣ Derin Nedenler (2–4 cümle) → Bu dinamiğin içsel, psikolojik kökenini açıkla.  
3️⃣ Eylem Alanı (1–2 cümle) → Kullanıcıya sezgisel bir yönlendirme veya dengeleme önerisi ver.  
Her yorumun başlığı (“headline”) etkileyici ama sade bir ifade olmalı (örnek: “İçsel Dengeyi Ararken”, “Kendini Anlatmanın Dansı”).  

JSON biçiminde üretim yap.  
Biçim hatası yapma. Metin dışında hiçbir şey yazma.  

Cevap şu biçimde olmalı:
{
  "headline": "string",
  "summary": "Ana Yorum bölümü (bir bütün, 3–6 cümle).",
  "reasons": ["Her biri bir cümle olacak, 2–4 adet. Derin nedenler burada."],
  "actions": ["1–2 kısa yönlendirme cümlesi. Kullanıcıya hitap et."],
  "themes": ["1–4 kelimelik, küçük harfli, içgörüyü yansıtan temalar. Örn: clarity, growth, grounding"]
}

Ek kurallar:
- Asla “interpretation unavailable” yazma.  
- Eğer veri yetersizse, kullanıcıya genel bir farkındalık teması üret (“Kendini tanıma sürecin derinleşiyor” gibi).  
- Asla JSON dışında açıklama veya İngilizce cümle ekleme.  
- Her alan dolu olmalı (headline, summary, reasons, actions, themes).  
""".strip()


def get_profile_collection():
    """Return the MongoDB collection for user profiles."""
    if not MONGO_URI:
        raise MongoUnavailable("MongoDB yapılandırılmadı.")
    client = ensure_mongo_connection(retries=3, delay=1.0, revalidate=False)
    return client[MONGO_DB_NAME][PROFILE_COLLECTION_NAME]


def serialise_profile(document: Mapping[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document into JSON-serialisable dict."""
    result = dict(document)
    identifier = result.pop("_id", None)
    if identifier is not None:
        result["id"] = str(identifier)
    created_at = result.get("created_at")
    if isinstance(created_at, datetime):
        result["created_at"] = created_at.isoformat()
    updated_at = result.get("updated_at")
    if isinstance(updated_at, datetime):
        result["updated_at"] = updated_at.isoformat()
    return result

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

ASPECT_ANGLE_LOOKUP = {name: angle for name, angle, _ in ASPECTS}

PLANET_DISPLAY_ORDER = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
    "North Node",
    "Lilith",
    "Chiron",
    "Fortune",
    "Vertex",
]


def _ordinal(value: int) -> str:
    suffixes = {1: "st", 2: "nd", 3: "rd"}
    if 10 <= value % 100 <= 20:
        suffix = "th"
    else:
        suffix = suffixes.get(value % 10, "th")
    return f"{value}{suffix}"


def _format_degree(degree: int | float | None, minute: int | float | None) -> str:
    deg = int(degree or 0)
    minutes_total = int(round(minute or 0))
    if minutes_total >= 60:
        deg += minutes_total // 60
        minutes_total %= 60
    return f"{deg}°{str(minutes_total).zfill(2)}'"


def _build_formatted_planet_positions(chart: Dict[str, Any]) -> list[str]:
    planets = chart.get("planets") or {}
    ordered_names = [name for name in PLANET_DISPLAY_ORDER if name in planets]
    ordered_names.extend(name for name in planets.keys() if name not in ordered_names)

    formatted: list[str] = []
    for name in ordered_names:
        details = planets.get(name) or {}
        sign = details.get("sign") or "Unknown"
        degree = details.get("degree")
        minute = details.get("minute")
        house = details.get("house")
        retrograde = details.get("retrograde")
        retro_suffix = ", Retrograde" if retrograde else ""
        house_label = f"{_ordinal(int(house))} House" if isinstance(house, int) and house > 0 else "Unknown House"
        formatted.append(
            f"{name} in {sign} {_format_degree(degree, minute)}, in {house_label}{retro_suffix}"
        )
    return formatted


def _build_formatted_house_positions(chart: Dict[str, Any]) -> list[str]:
    houses = chart.get("house_positions") or {}
    formatted: list[str] = []
    for index in sorted(houses, key=lambda x: int(x)):
        details = houses[index] or {}
        sign = details.get("sign") or "Unknown"
        degree = details.get("degree")
        minute = details.get("minute")
        formatted.append(
            f"{_ordinal(int(index))} House in {sign} {_format_degree(degree, minute)}"
        )
    return formatted


def _build_formatted_aspects(chart: Dict[str, Any]) -> list[str]:
    aspects = chart.get("aspects") or []
    formatted: list[str] = []
    for item in aspects:
        planet1 = item.get("planet1") or "Unknown"
        planet2 = item.get("planet2") or "Unknown"
        aspect_name = item.get("aspect") or "Aspect"
        exact_angle = item.get("exact_angle")

        expected_angle = ASPECT_ANGLE_LOOKUP.get(aspect_name)
        orb_value: float | None = None
        if expected_angle is not None and isinstance(exact_angle, (int, float)):
            orb_value = abs(exact_angle - expected_angle)

        if orb_value is not None:
            orb_degrees = int(orb_value)
            orb_minutes = int(round((orb_value - orb_degrees) * 60))
            if orb_minutes >= 60:
                orb_degrees += orb_minutes // 60
                orb_minutes %= 60
            orb_text = f"{orb_degrees}°{str(orb_minutes).zfill(2)}'"
            formatted.append(f"{planet1} {aspect_name} {planet2} (Orb: {orb_text})")
        else:
            formatted.append(f"{planet1} {aspect_name} {planet2}")
    return formatted


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

    prompt = (
        f"{AI_PROMPT}\n\n"
        "Verilen astrolojik veriyi aşağıdaki bağlamla yorumla ve belirtilen şemaya uygun JSON üret:\n"
        f"- Temalar: {themes}\n"
        f"- Ton: {tone_value}\n"
        f"- Ana eksen: {archetype.get('dominant_axis') or 'belirtilmedi'}\n"
        f"- Dikkate değer açılar: {aspects}\n"
        f"- Davranış kalıpları: {archetype.get('behavior_patterns')}\n"
        "Her alanı Türkçe doldur; temaları doğal dile çevir.\n"
    )

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
        return build_result(fallback_ai)

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

    system_prompt = "You are an experienced psychological astrologer and storyteller."
    context_payload = {
        "core_themes": archetype.get("core_themes", []),
        "story_tone": archetype.get("story_tone"),
        "dominant_axis": archetype.get("dominant_axis"),
        "notable_aspects": archetype.get("notable_aspects", []),
        "behavior_patterns": archetype.get("behavior_patterns", []),
        "chart_data": chart_data,
    }
    user_prompt = (
        f"{AI_PROMPT}\n\n"
        "Verilen bağlamı kullanarak şemaya sadık kal:\n"
        f"{json.dumps(context_payload, ensure_ascii=False)}"
    )

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


def calc_planets(
    jd_ut: float,
    cusps: Sequence[float] | None = None,
    *,
    angles: Mapping[str, Any] | None = None,
) -> Dict[str, Dict[str, Any]]:
    """Calculate planetary longitudes with safe unpacking and metadata."""

    planets: Dict[str, Dict[str, Any]] = {}
    cusp_sequence = list(cusps) if cusps is not None else None
    cusp_list = [float(cusp_sequence[i]) % 360 for i in range(1, min(len(cusp_sequence), 13))] if cusp_sequence else None
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
        "North Node": swe.TRUE_NODE,
        "Lilith": getattr(swe, "MEAN_APOG", getattr(swe, "OSCU_APOG", swe.MEAN_NODE)),
        "Chiron": swe.CHIRON,
        "Vertex": swe.VERTEX,
    }

    def resolve_house(longitude: float) -> int | None:
        if not cusp_sequence or len(cusp_sequence) < 2:
            return None
        lon_val = longitude % 360
        for idx in range(1, min(len(cusp_sequence), 13)):
            start = cusp_sequence[idx] % 360
            end = cusp_sequence[1] % 360 if idx == 12 else cusp_sequence[idx + 1] % 360
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

            lon_norm = normalize_degrees(lon_float)
            degree_value = None
            minute_value = None
            if lon_norm is not None:
                degree_in_sign = lon_norm % 30
                degree_value = int(degree_in_sign)
                minute_value = int(round((degree_in_sign - degree_value) * 60))
                if minute_value == 60:
                    minute_value = 0
                    degree_value = (degree_value + 1) % 30

            planets[planet_name] = {
                "longitude": round(lon_norm, 2) if lon_norm is not None else None,
                "latitude": round(lat_float, 2) if lat_float is not None else None,
                "distance": round(dist_float, 4) if dist_float is not None else None,
                "speed": round(speed_float, 4) if speed_float is not None else None,
                "sign": get_zodiac_sign(lon_norm) if lon_norm is not None else None,
                "house": house,
                "retrograde": bool(speed_float is not None and speed_float < 0),
                "degree": degree_value,
                "minute": minute_value,
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

    # Part of Fortune (day / night formula)
    if angles and cusp_list:
        try:
            asc = normalize_degrees(angles.get("ascendant"))
            sun_lon = normalize_degrees(planets.get("Sun", {}).get("longitude"))
            moon_lon = normalize_degrees(planets.get("Moon", {}).get("longitude"))
            sun_house = planets.get("Sun", {}).get("house")
            is_day_chart = bool(sun_house and 7 <= sun_house <= 12)
            if asc is not None and sun_lon is not None and moon_lon is not None:
                if is_day_chart:
                    fortune_lon = normalize_degrees(asc + moon_lon - sun_lon)
                else:
                    fortune_lon = normalize_degrees(asc - moon_lon + sun_lon)
                fortune_house = determine_house(fortune_lon, cusp_list)
                fortune_degree = fortune_lon % 30 if fortune_lon is not None else 0.0
                fortune_degree_whole = int(fortune_degree)
                fortune_minute = int(round((fortune_degree - fortune_degree_whole) * 60))
                if fortune_minute == 60:
                    fortune_minute = 0
                    fortune_degree_whole = (fortune_degree_whole + 1) % 30
                planets["Fortune"] = {
                    "longitude": round(fortune_lon, 2),
                    "latitude": None,
                    "distance": None,
                    "speed": None,
                    "sign": get_zodiac_sign(fortune_lon),
                    "house": fortune_house,
                    "retrograde": False,
                    "degree": fortune_degree_whole,
                    "minute": fortune_minute,
                }
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to calculate Part of Fortune: %s", exc)

    return planets


def calc_houses(jd_ut: float, latitude: float, longitude: float) -> tuple[list[float], Dict[str, float]]:
    """Calculate Placidus houses and ensure ASC–House 1 alignment."""
    # Calculate Placidus houses
    raw_cusps, ascmc = swe.houses(jd_ut, latitude, longitude, b"P")
    houses = [float(raw_cusps[i]) % 360 for i in range(12)]
    angles = {
        "ascendant": round(ascmc[0] % 360, 4),
        "midheaven": round(ascmc[1] % 360, 4),
    }
    angles["ascendant_sign"] = get_zodiac_sign(angles["ascendant"])
    angles["midheaven_sign"] = get_zodiac_sign(angles["midheaven"])
    angles["descendant"] = round((angles["ascendant"] + 180) % 360, 4)
    angles["imum_coeli"] = round((angles["midheaven"] + 180) % 360, 4)
    angles["descendant_sign"] = get_zodiac_sign(angles["descendant"])
    angles["imum_coeli_sign"] = get_zodiac_sign(angles["imum_coeli"])

    # Sanity check for ASC alignment
    delta = (angles["ascendant"] - houses[0]) % 360
    if delta:
        logger.debug("Aligning house cusps with ASC. Shift=%.4f°", delta)
        houses = [(h + delta) % 360 for h in houses]
    logger.info("ASC=%.4f°, House1=%.4f°", angles["ascendant"], houses[0])

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


def normalize_degrees(value: float | None) -> float | None:
    if value is None:
        return None
    return value % 360


LABEL_PREFIX_PATTERN = re.compile(r"^(?:[\s•·\-–—]*)\b(headline|summary|advice|challenge|struggle|gift|strength|lesson|shadow|insight|focus|theme|themes|story)\b[:\-–—]?\s*", re.IGNORECASE)
SUMMARY_LABEL_PATTERN = re.compile(r"^(?P<label>[A-Za-zÇĞİÖŞÜçğıöşü\s]{2,24})[:\-–—]\s*(?P<body>.+)$")
SUMMARY_LABEL_MAP = {
    "challenge": "Meydan okuman",
    "struggle": "Zorlandığın alan",
    "gift": "Doğuştan ışığın",
    "strength": "Dayandığın güç",
    "lesson": "Öğrenmen gereken ders",
    "shadow": "Gölgede kalan yönün",
    "focus": "Odaklandığın yer",
    "insight": "İçgörün",
    "theme": "Tema",
    "themes": "Tema",
    "story": "Hikâye",
}


def strip_label_prefix(text: Any) -> str:
    if not isinstance(text, str):
        return ""
    cleaned = LABEL_PREFIX_PATTERN.sub("", text or "").strip()
    cleaned = re.sub(r"^[•·\-\u2022]+\s*", "", cleaned)
    return cleaned.strip()


def flatten_summary_text(text: Any, *, joiner: str = " ") -> str:
    if not isinstance(text, str):
        return ""
    segments: list[str] = []
    for raw_line in re.split(r"[\n•\u2022]+", text):
        line = raw_line.strip()
        if not line:
            continue
        match = SUMMARY_LABEL_PATTERN.match(line)
        if match:
            label = match.group("label").strip().lower()
            body = match.group("body").strip()
            if not body:
                continue
            if label in {"headline", "summary", "advice"}:
                segments.append(body)
                continue
            prefix = SUMMARY_LABEL_MAP.get(label, "")
            if prefix:
                segments.append(f"{prefix}: {body}")
            else:
                segments.append(body)
        else:
            segments.append(line)

    if not segments:
        return clean_text(strip_label_prefix(text))

    combined = joiner.join(segments).strip()
    combined = re.sub(r"\s{2,}", " ", combined)
    return clean_text(combined)


def first_sentences(text: str, limit: int = 2) -> str:
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= limit:
        return text.strip()
    return " ".join(sentences[:limit]).strip()


DEFAULT_REASON_FALLBACKS = [
    "İç sesini duymak, dış dünyada kurduğun yapıya sıcaklık katıyor.",
    "Duygularını sorumluluklarınla dengelemek olgunlaşma alanın.",
    "Anlam arayışını paylaşmak çevrende güven köprüleri kuruyor.",
]

DEFAULT_ACTION_FALLBACKS = [
    "Her gün 5 dakikalık nefesle bedeni ve zihni hizala.",
    "Haftada bir sezgisel yazı çalışmasıyla hislerini isimlendir.",
    "Akşamları günü üç maddede yeniden çerçevele.",
]


def _format_title(title: str | None) -> str:
    cleaned = clean_text(title)
    return cleaned or "Kozmik Yorum"


def _prepare_reasons(
    reasons: Iterable[str] | None,
    fallback_tags: Iterable[str] | None = None,
) -> list[str]:
    prepared: list[str] = []
    seen: set[str] = set()

    def _append(sentence: str) -> None:
        text = clean_text(strip_label_prefix(sentence))
        if not text:
            return
        if not text.endswith("."):
            text += "."
        if text not in seen:
            seen.add(text)
            prepared.append(text)

    for item in reasons or []:
        _append(item)
        if len(prepared) >= 4:
            break

    for tag in fallback_tags or []:
        if len(prepared) >= 4:
            break
        tag_text = clean_text(tag)
        if not tag_text:
            continue
        template = f"Tema: {tag_text.lower()} enerjisini bilinçli yönettiğinde dengede kalırsın."
        _append(template)

    idx = 0
    while len(prepared) < 2 and idx < len(DEFAULT_REASON_FALLBACKS):
        _append(DEFAULT_REASON_FALLBACKS[idx])
        idx += 1

    if len(prepared) < 2:
        while len(prepared) < 2:
            _append("İçsel ritmini duyduğunda adımların hafifler.")

    return prepared[:4]


def _prepare_actions(actions: Iterable[str] | None) -> list[str]:
    prepared: list[str] = []
    seen: set[str] = set()

    def _append(sentence: str) -> None:
        text = clean_text(strip_label_prefix(sentence))
        if not text:
            return
        text = text[0].upper() + text[1:] if text else text
        if not text.endswith("."):
            text += "."
        if text not in seen:
            seen.add(text)
            prepared.append(text)

    for item in actions or []:
        _append(item)
        if len(prepared) >= 2:
            break

    idx = 0
    while len(prepared) < 1 and idx < len(DEFAULT_ACTION_FALLBACKS):
        _append(DEFAULT_ACTION_FALLBACKS[idx])
        idx += 1

    idx = 0
    while len(prepared) < 2 and idx < len(DEFAULT_ACTION_FALLBACKS):
        _append(DEFAULT_ACTION_FALLBACKS[idx])
        idx += 1

    return prepared[:2]


def _prepare_tags(tags: Iterable[str] | None) -> list[str]:
    cleaned_tags: list[str] = []
    seen: set[str] = set()
    for tag in tags or []:
        text = clean_text(tag)
        if not text:
            continue
        if text not in seen:
            seen.add(text)
            cleaned_tags.append(text)
        if len(cleaned_tags) >= 6:
            break
    return cleaned_tags


def build_card_payload(
    *,
    title: str,
    main: str,
    reasons: Iterable[str] | None = None,
    actions: Iterable[str] | None = None,
    tags: Iterable[str] | None = None,
    confidence: Any = None,
) -> Dict[str, Any]:
    narrative_text = limit_sentences(main, min_sentences=3, max_sentences=6) if main else ""
    fragments = [
        fragment.strip()
        for fragment in re.split(r"(?<=[.!?])\s+", narrative_text)
        if fragment.strip()
    ]
    filler_idx = 0
    while len(fragments) < 3 and filler_idx < len(DEFAULT_REASON_FALLBACKS):
        filler_sentence = clean_text(DEFAULT_REASON_FALLBACKS[filler_idx])
        if filler_sentence:
            fragments.append(filler_sentence)
        filler_idx += 1
    if fragments:
        narrative_text = " ".join(fragments[:6]).rstrip(".!?")
        if narrative_text:
            narrative_text += "."

    prepared_tags = _prepare_tags(tags)

    card = {
        "title": _format_title(title),
        "narrative": {
            "main": narrative_text,
        },
        "reasons": {
            "psychology": _prepare_reasons(reasons, prepared_tags),
        },
        "actions": _prepare_actions(actions),
        "tags": prepared_tags,
    }
    confidence_label = map_confidence_label(confidence)
    if confidence_label:
        card["confidence_label"] = confidence_label
    return card


def build_life_card(
    ai_payload: Mapping[str, Any] | None,
    life_narrative: Mapping[str, Any] | None,
    archetype: Mapping[str, Any] | None,
) -> Dict[str, Any]:
    ai_payload = ai_payload or {}
    life_narrative = life_narrative or {}
    archetype = archetype or {}

    title = ai_payload.get("headline") or "Hayat Anlatısı"
    primary_texts = [
        life_narrative.get("text"),
        ai_payload.get("summary"),
        archetype.get("life_expression"),
    ]
    sentences: list[str] = []
    for block in primary_texts:
        cleaned_block = clean_text(strip_label_prefix(block))
        if not cleaned_block:
            continue
        for piece in re.split(r"(?<=[.!?])\s+", cleaned_block):
            piece_clean = clean_text(piece)
            if piece_clean and piece_clean not in sentences:
                sentences.append(piece_clean)
    if len(sentences) < 3:
        sentences.extend(DEFAULT_REASON_FALLBACKS)
    main_text = " ".join(sentences[:6])

    reasons: list[str] = []
    axis = life_narrative.get("axis")
    focus = life_narrative.get("focus")
    if axis:
        reasons.append(f"Eksen: {axis} hattı kişisel derslerini belirliyor.")
    if focus:
        reasons.append(f"Odak: {focus}.")
    derived = life_narrative.get("derived_from")
    if isinstance(derived, Sequence):
        for item in derived[:3]:
            if isinstance(item, Mapping):
                pair = item.get("pair")
                aspect = item.get("aspect")
                orb = item.get("orb")
                if pair and aspect:
                    text = f"{pair} • {aspect}"
                    if isinstance(orb, (int, float)):
                        text += f" • orb {orb}°"
                    reasons.append(text)
    themes = life_narrative.get("themes")
    if not reasons and isinstance(themes, Sequence):
        reasons.extend(f"Tema: {theme}" for theme in themes[:3] if isinstance(theme, str))

    actions: list[str] = []
    advice = ai_payload.get("advice")
    if isinstance(advice, str) and advice.strip():
        actions.append(advice)
    life_focus = archetype.get("life_focus")
    if isinstance(life_focus, str) and life_focus.strip():
        actions.append(f"Odaklan: {life_focus.strip()}")

    tags = []
    if isinstance(themes, Sequence):
        tags.extend(theme for theme in themes if isinstance(theme, str))
    if not tags and isinstance(archetype.get("core_themes"), Sequence):
        tags.extend(theme for theme in archetype["core_themes"] if isinstance(theme, str))

    return build_card_payload(
        title=title,
        main=main_text,
        reasons=reasons,
        actions=actions,
        tags=tags,
        confidence=life_narrative.get("confidence"),
    )


def build_category_card(
    category: Mapping[str, Any] | None,
    *,
    default_title: str,
    fallback_themes: Iterable[str] | None = None,
    extra_reasons: Iterable[str] | None = None,
    extra_actions: Iterable[str] | None = None,
    confidence: Any = None,
) -> Dict[str, Any] | None:
    if not isinstance(category, Mapping):
        return None
    title = category.get("headline") or default_title
    summary = category.get("summary") or ""
    themes = category.get("themes") or fallback_themes or []

    reasons = list(extra_reasons or [])
    tag_sources = []
    if isinstance(themes, Sequence):
        tag_sources.extend(theme for theme in themes if isinstance(theme, str))

    actions = list(extra_actions or [])
    advice = category.get("advice")
    if isinstance(advice, str) and advice.strip():
        actions.append(advice)

    return build_card_payload(
        title=title,
        main=summary,
        reasons=reasons,
        actions=actions,
        tags=tag_sources or themes,
        confidence=confidence,
    )


def build_shadow_card(
    category: Mapping[str, Any] | None,
    behavior_patterns: Iterable[Mapping[str, Any]] | None,
) -> Dict[str, Any] | None:
    extra_reasons = []
    extra_tags = []
    if behavior_patterns:
        for pattern in list(behavior_patterns)[:3]:
            if isinstance(pattern, Mapping):
                label = pattern.get("pattern")
                expression = pattern.get("expression")
                if label and expression:
                    extra_reasons.append(f"{label}: {expression}")
                    extra_tags.append(label)
    card = build_category_card(
        category,
        default_title="Gölge Çalışması",
        fallback_themes=[pattern for pattern in extra_tags],
        extra_reasons=extra_reasons,
    )
    if card is None and extra_reasons:
        card = build_card_payload(
            title="Gölgeler",
            main="Gölgede kalan kalıpları sevgiyle tanımak dönüşümü başlatır.",
            reasons=extra_reasons,
            actions=[],
            tags=extra_tags,
        )
    elif card is not None:
        tags = card.get("tags") or []
        card["tags"] = list({*tags, *extra_tags})[:6]
    return card


def normalize_ai_payload(value: Any) -> Dict[str, str]:
    fallback = {
        "headline": "Interpretation unavailable",
        "summary": "We could not generate a full interpretation at this time.",
        "advice": "Stay grounded and patient; your insight is unfolding.",
    }
    if isinstance(value, Mapping):
        if all(key in value for key in ("headline", "summary", "advice")):
            result = {
                "headline": clean_text(strip_label_prefix(value.get("headline") or fallback["headline"]))
                or fallback["headline"],
                "summary": flatten_summary_text(value.get("summary") or fallback["summary"]) or fallback["summary"],
                "advice": clean_text(strip_label_prefix(value.get("advice") or fallback["advice"])) or fallback["advice"],
            }
            return result
        inner = value.get("ai_interpretation")
        if isinstance(inner, Mapping):
            return normalize_ai_payload(inner)
    return {
        "headline": fallback["headline"],
        "summary": fallback["summary"],
        "advice": fallback["advice"],
    }


def build_interpretation_categories(
    archetype: Mapping[str, Any],
    ai_output: Mapping[str, str],
) -> Dict[str, Dict[str, Any]]:
    def clean_list(items: Iterable[Any]) -> list[str]:
        cleaned = []
        for item in items or []:
            if isinstance(item, str):
                text = item.strip()
                if text:
                    cleaned.append(text)
        return cleaned

    def make_card(headline: str, summary: str, advice: str, themes: Iterable[str]) -> Dict[str, Any]:
        return {
            "headline": headline.strip() or ai_output.get("headline"),
            "summary": summary.strip() or ai_output.get("summary"),
            "advice": advice.strip() or ai_output.get("advice"),
            "themes": clean_list(themes),
        }

    themes = clean_list(archetype.get("core_themes"))
    tone = str(archetype.get("story_tone") or "").strip()
    life_focus = str(archetype.get("life_focus") or "").strip()
    life_expression = strip_label_prefix(archetype.get("life_expression") or "")
    dominant_axis = str(archetype.get("dominant_axis") or "").strip()
    behavior_patterns = archetype.get("behavior_patterns") or []

    summary_text = ai_output.get("summary", "")
    primary_summary = first_sentences(summary_text, 2)

    love_card = make_card(
        ai_output.get("headline") or "Kalbin Kimyası",
        primary_summary or life_expression or summary_text,
        ai_output.get("advice") or "Kalbini sezgilerinle hizala.",
        themes[:3],
    )

    career_summary_parts = []
    if life_focus:
        career_summary_parts.append(life_focus.capitalize())
    if tone:
        career_summary_parts.append(f"{tone} bir yaklaşımla ilerliyorsun.")
    if not career_summary_parts:
        career_summary_parts.append("Enerjini anlamlı bir amaca yönlendiriyorsun.")
    career_card = make_card(
        "İş & Misyon",
        " ".join(career_summary_parts),
        "Somut hedeflerini ruhunun ritmiyle hizala.",
        themes[3:6] or themes[:3],
    )

    spiritual_card = make_card(
        "Ruhsal Akış",
        first_sentences(life_expression or summary_text, 3),
        "Ruhunun fısıltılarını her günkü ritüellerine davet et.",
        clean_list([tone, dominant_axis]) or themes[1:4],
    )

    pattern_lines = []
    pattern_names = []
    for item in behavior_patterns[:2]:
        if isinstance(item, Mapping):
            pattern = str(item.get("pattern") or "").strip()
            expression = str(item.get("expression") or "").strip()
            if pattern:
                pattern_names.append(pattern)
            if pattern and expression:
                pattern_lines.append(f"{pattern}: {expression}")
    shadow_summary = " • ".join(pattern_lines) or "Gölgelerini kabullenmek, potansiyelini özgürleştiriyor."
    shadow_card = make_card(
        "Shadow Work",
        shadow_summary,
        "Karanlık noktalarına da sevgiyle dokun.",
        pattern_names or themes[-3:] or themes[:3],
    )

    return {
        "love": love_card,
        "career": career_card,
        "spiritual": spiritual_card,
        "shadow": shadow_card,
    }


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

    try:
        swe.set_topo(location.longitude, location.latitude, 0.0)
    except Exception as exc:  # pragma: no cover - defensive
        logger.debug("Failed to set topocentric coordinates: %s", exc)

    house_list, angles = calc_houses(jd_ut, location.latitude, location.longitude)
    cusp_sequence = [0.0, *house_list]

    planets: Dict[str, Dict[str, Any]] = calc_planets(jd_ut, cusp_sequence, angles=angles)

    houses: Dict[str, Any] = {
        str(index + 1): round((value % 360), 4) for index, value in enumerate(house_list)
    }
    houses_detailed = {}
    for index, value in enumerate(house_list):
        lon = normalize_degrees(value) or 0.0
        degree_in_sign = lon % 30
        houses_detailed[str(index + 1)] = {
            "longitude": round(lon, 4),
            "sign": get_zodiac_sign(lon),
            "degree": int(degree_in_sign),
            "minute": int(round((degree_in_sign - int(degree_in_sign)) * 60)),
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
    angle_items = []
    asc = angles.get("ascendant")
    mc = angles.get("midheaven")
    if asc is not None:
        angle_items.extend(
            [
                ("Ascendant", asc),
                ("Descendant", (asc + 180) % 360),
            ]
        )
    if mc is not None:
        angle_items.extend(
            [
                ("Midheaven", mc),
                ("Imum Coeli", (mc + 180) % 360),
            ]
        )
    planet_items.extend(angle_items)
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
        "house_positions": houses_detailed,
        "angles": angles,
        "aspects": aspects,
    }


def diff_angle(lon1: float, lon2: float) -> float:
    diff = abs(lon1 - lon2) % 360
    return diff if diff <= 180 else 360 - diff


def calculate_chart_from_birth_details(date_value: str, time_value: str, city_value: str) -> Dict[str, Any]:
    """Utility used by interpretation endpoint when only birth inputs are provided."""

    payload = {
        "date": (date_value or "").strip(),
        "time": (time_value or "").strip(),
        "city": (city_value or "").strip(),
    }
    return build_natal_chart(payload)


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
        chart["formatted_positions"] = _build_formatted_planet_positions(chart)
        chart["formatted_houses"] = _build_formatted_house_positions(chart)
        chart["formatted_aspects"] = _build_formatted_aspects(chart)
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


def _normalise_chart_payload(chart_data: Any) -> Dict[str, Any] | None:
    if isinstance(chart_data, dict):
        return dict(chart_data)
    if isinstance(chart_data, str):
        try:
            parsed = json.loads(chart_data)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return None
    return None


def _extract_profile_payload(payload: Mapping[str, Any]) -> Dict[str, Any]:
    first_name = str(payload.get("firstName") or "").strip()
    last_name = str(payload.get("lastName") or "").strip()
    email = str(payload.get("email") or "").strip().lower()

    profile_payload: Dict[str, Any] = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "date": payload.get("date"),
        "time": payload.get("time"),
        "city": payload.get("city"),
        "chart": _normalise_chart_payload(payload.get("chart")),
        "updated_at": datetime.utcnow(),
    }
    return profile_payload


def _validate_profile_payload(profile_payload: Mapping[str, Any]) -> list[str]:
    errors = []
    if not profile_payload.get("firstName"):
        errors.append("firstName gereklidir.")
    if not profile_payload.get("lastName"):
        errors.append("lastName gereklidir.")
    email = profile_payload.get("email")
    if not email:
        errors.append("email gereklidir.")
    elif "@" not in str(email):
        errors.append("Geçerli bir email giriniz.")
    for key in ("date", "time", "city"):
        if not profile_payload.get(key):
            errors.append(f"{key} alanı gereklidir.")
    return errors


@app.route("/api/profile", methods=["GET", "OPTIONS"])
def get_profile():
    if request.method == "OPTIONS":
        return "", 204

    email = request.args.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "email parametresi gereklidir."}), 400

    try:
        collection = get_profile_collection()
        document = collection.find_one({"email": email})
    except MongoUnavailable as exc:
        logger.warning("Mongo unavailable during profile fetch: %s", exc)
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Unexpected Mongo error during profile fetch: %s", exc)
        return jsonify({"error": "Profil aranırken hata oluştu."}), 500

    if not document:
        return jsonify({"error": "Profil bulunamadı."}), 404

    return jsonify(serialise_profile(document)), 200


@app.route("/api/profile", methods=["POST", "PUT", "OPTIONS"])
def upsert_profile():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True)
    if not isinstance(payload, Mapping):
        return jsonify({"error": "Geçersiz JSON yükü."}), 400

    profile_payload = _extract_profile_payload(payload)
    errors = _validate_profile_payload(profile_payload)
    if errors:
        return jsonify({"error": " ".join(errors)}), 400

    try:
        collection = get_profile_collection()
        updated_document = collection.find_one_and_update(
            {"email": profile_payload["email"]},
            {
                "$set": profile_payload,
                "$setOnInsert": {"created_at": datetime.utcnow()},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
    except MongoUnavailable as exc:
        logger.warning("Profile save skipped - Mongo unavailable: %s", exc)
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Profile save failed: %s", exc)
        return jsonify({"error": "Profil kaydedilemedi."}), 500

    status_code = 200 if request.method == "PUT" else 200
    return jsonify(serialise_profile(updated_document)), status_code


@app.route("/interpretation", methods=["POST", "OPTIONS"])
@app.route("/api/interpretation", methods=["POST", "OPTIONS"])
def interpretation():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True)
    if not isinstance(payload, Mapping):
        logger.warning("Interpretation endpoint received invalid JSON payload: %s", payload)
        return jsonify({"error": "Invalid JSON payload."}), 400

    chart_data = payload.get("chart_data")
    alt_strategy = payload.get("alt_strategy")

    if not isinstance(chart_data, Mapping):
        birth_date = payload.get("birth_date") or payload.get("date")
        birth_time = payload.get("birth_time") or payload.get("time")
        birth_place = payload.get("birth_place") or payload.get("city")
        if not all((birth_date, birth_time, birth_place)):
            logger.warning("Interpretation endpoint missing chart_data and birth inputs: %s", payload)
            return jsonify({
                "error": "chart_data must be provided as an object OR birth_date/time/place must be supplied.",
            }), 400
        try:
            chart_data = calculate_chart_from_birth_details(birth_date, birth_time, birth_place)
        except Exception as exc:  # pragma: no cover - network/location failures
            logger.exception("Failed to build chart from inputs")
            return jsonify({"error": f"Failed to calculate chart: {exc}"}), 500

    chart_dict = dict(chart_data)

    try:
        archetype = generate_full_archetype_report(chart_dict)
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Failed to extract archetype data")
        return jsonify({"error": "Failed to extract archetype data."}), 500

    life_narrative = archetype.get("life_narrative")
    if not life_narrative:
        life_layer = integrate_life_expression(chart_dict, archetype_data=archetype)
        archetype.update(life_layer)
        life_narrative = life_layer.get("life_narrative")

    alternate_narrative = None
    if isinstance(alt_strategy, str):
        alt_layer = integrate_life_expression(chart_dict, archetype_data=archetype, strategy=alt_strategy)
        alternate_narrative = alt_layer.get("life_narrative")
        if alternate_narrative:
            archetype.update(alt_layer)
            life_narrative = alternate_narrative

    try:
        ai_result = _request_refined_interpretation(archetype, chart_dict)
    except AIError as exc:
        logger.error("Groq interpretation error: %s", exc)
        ai_result = get_ai_interpretation(chart_dict)
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Unexpected interpretation failure")
        ai_result = get_ai_interpretation(chart_dict)

    ai_payload = normalize_ai_payload(ai_result)
    categories = build_interpretation_categories(archetype, ai_payload)

    cards: Dict[str, Any] = {}
    life_card = build_life_card(ai_payload, life_narrative, archetype)
    if life_card:
        cards["life"] = life_card

    career_reasons = []
    life_focus = archetype.get("life_focus")
    story_tone = archetype.get("story_tone")
    if isinstance(life_focus, str) and life_focus.strip():
        career_reasons.append(f"Odak: {life_focus.strip()}")
    if isinstance(story_tone, str) and story_tone.strip():
        career_reasons.append(f"Ton: {story_tone.strip()}")
    career_card = build_category_card(
        categories.get("career") if isinstance(categories, Mapping) else None,
        default_title="İş & Amaç",
        extra_reasons=career_reasons,
    )
    if career_card:
        cards["career"] = career_card

    spiritual_reasons = []
    dominant_axis = archetype.get("dominant_axis")
    if isinstance(dominant_axis, str) and dominant_axis.strip():
        spiritual_reasons.append(f"Öne çıkan eksen: {dominant_axis.strip()}")
    spiritual_card = build_category_card(
        categories.get("spiritual") if isinstance(categories, Mapping) else None,
        default_title="Ruhsal Akış",
        extra_reasons=spiritual_reasons,
    )
    if spiritual_card:
        cards["spiritual"] = spiritual_card

    love_card = build_category_card(
        categories.get("love") if isinstance(categories, Mapping) else None,
        default_title="Aşk & İlişkiler",
    )
    if love_card:
        cards["love"] = love_card

    shadow_card = build_shadow_card(
        categories.get("shadow") if isinstance(categories, Mapping) else None,
        archetype.get("behavior_patterns") if isinstance(archetype, Mapping) else None,
    )
    if shadow_card:
        cards["shadow"] = shadow_card

    response_body: Dict[str, Any] = {
        "themes": archetype.get("core_themes", []),
        "ai_interpretation": ai_payload,
        "tone": archetype.get("story_tone"),
        "categories": categories,
        "archetype": archetype,
        "life_narrative": life_narrative,
    }

    if life_card:
        life_block = response_body.setdefault("life_narrative", {})
        primary_text = life_card.get("narrative", {}).get("main") if isinstance(life_card.get("narrative"), Mapping) else ""
        life_text = limit_sentences(primary_text or life_block.get("text") or "", min_sentences=3, max_sentences=6)
        if life_text:
            life_block["text"] = life_text
        axis_candidate = clean_text(life_block.get("axis") or archetype.get("dominant_axis") or "")
        axis_scores = payload.get("axis_scores") if isinstance(payload.get("axis_scores"), Mapping) else {}
        dominant_axis = pick_axis(axis_scores, axis_candidate or "Yay–İkizler")
        life_block["axis"] = dominant_axis
        life_block["confidence_label"] = life_card.get("confidence_label") or map_confidence_label(life_block.get("confidence"))
        life_block["card"] = life_card
    if cards:
        expanded_cards = dict(cards)
        if "life" in cards:
            expanded_cards.setdefault("essence", cards["life"])
        if "career" in cards:
            expanded_cards.setdefault("path", cards["career"])
        if "love" in cards:
            expanded_cards.setdefault("heart", cards["love"])
        if "spiritual" in cards:
            expanded_cards.setdefault("mind", cards["spiritual"])
        response_body["cards"] = expanded_cards

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
    health = {"status": "ok"}

    if MONGO_URI:
        mongo_ok, detail = mongo_healthcheck()
        health["mongo"] = {
            "status": "ok" if mongo_ok else "error",
            "detail": detail,
        }
        if not mongo_ok:
            health["status"] = "degraded"
    else:
        health["mongo"] = {"status": "disabled", "detail": "MongoDB bağlantısı yapılandırılmadı."}

    return jsonify(health)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
