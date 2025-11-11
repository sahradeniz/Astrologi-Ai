"""Utility to derive archetypal themes from natal chart data."""

from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Sequence, Tuple

__all__ = [
    "extract_archetype_data",
    "derive_behavior_patterns",
    "integrate_life_expression",
    "generate_full_archetype_report",
    "clean_text",
    "limit_sentences",
    "map_confidence_label",
    "pick_axis",
]

TILDE = "–"


def clean_text(value: str | None) -> str:
    """Strip markdown/code fences, JSON artefacts, and normalise whitespace."""
    if not isinstance(value, str):
        return ""
    text = value
    text = re.sub(r"```+json|```+|^json\\b", "", text, flags=re.IGNORECASE).strip()

    def _strip_brackets(match: re.Match[str]) -> str:
        items = [
            piece.strip(" '\"")
            for piece in match.group(0).strip("[]").split(",")
            if piece.strip(" '\"")
        ]
        return ", ".join(items)

    text = re.sub(r"\[[^\[\]]*\]", _strip_brackets, text)
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace(" - ", f" {TILDE} ")
    text = re.sub(r"\s*•\s*", " • ", text)
    return text.strip()


def limit_sentences(value: str | None, min_sentences: int = 3, max_sentences: int = 6) -> str:
    """Clamp text to a 3–6 sentence window in a gentle, human-readable way."""
    cleaned = clean_text(value)
    if not cleaned:
        return ""
    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", cleaned)
        if sentence.strip()
    ]
    if not sentences:
        return cleaned
    clipped = sentences[:max_sentences]
    if len(clipped) < min_sentences:
        clipped = sentences[: max(len(sentences), min_sentences)]
    joined = " ".join(clipped).rstrip(".!?")
    return f"{joined}."


def map_confidence_label(score: float | None) -> str:
    if score is None:
        return "Dengeli"
    if score >= 0.8:
        return "Net"
    if score >= 0.6:
        return "Oldukça net"
    return "İlham verici"


def pick_axis(axis_scores: Dict[str, float] | None, fallback: str) -> str:
    preferred_order = ["Yay–İkizler", "Yengeç–Oğlak", "Terazi–Koç", "Boğa–Akrep", "Başak–Balık"]
    if not axis_scores:
        return fallback
    best_axis = max(axis_scores.items(), key=lambda item: item[1])[0]
    return best_axis if best_axis in preferred_order else fallback
# Mapping of aspect types to their core thematic interpretations.
ASPECT_THEMES = {
    "square": "challenge",
    "opposition": "balance",
    "trine": "flow",
    "sextile": "opportunity",
    "conjunction": "fusion",
}

# Themes that emerge when specific planets appear within an aspect.
SPECIAL_PLANET_THEMES = {
    "chiron": "healing",
    "saturn": "responsibility",
    "moon": "emotion",
    "pluto": "transformation",
}

# Broad planetary influences that apply even outside of aspects.
BROAD_PLANET_THEMES = {
    "jupiter": "growth",
    "mars": "action",
    "venus": "love",
    "neptune": "intuition",
}


EXPECTED_ASPECT_ANGLES = {
    "Conjunction": 0.0,
    "conjunction": 0.0,
    "Sextile": 60.0,
    "sextile": 60.0,
    "Square": 90.0,
    "square": 90.0,
    "Trine": 120.0,
    "trine": 120.0,
    "Opposition": 180.0,
    "opposition": 180.0,
}


def analyze_aspects_weighted(chart_data: Dict[str, Any]) -> Tuple[Dict[str, float], List[dict]]:
    """Compute lightweight theme scores based on aspect patterns.

    Returns
    -------
    Tuple[Dict[str, float], List[dict]]
        Aggregated theme scores and provenance list with planet pairs/aspects.
    """

    theme_scores: Dict[str, float] = {}
    derived_from: List[dict] = []

    aspects = chart_data.get("aspects") if isinstance(chart_data, dict) else None
    if not isinstance(aspects, Sequence):
        return theme_scores, derived_from

    for aspect in aspects:
        if not isinstance(aspect, dict):
            continue
        planet1 = aspect.get("planet1")
        planet2 = aspect.get("planet2")
        aspect_name = aspect.get("aspect")
        if not planet1 or not planet2 or not aspect_name:
            continue

        pair = f"{planet1}–{planet2}"
        exact_angle = aspect.get("exact_angle")
        expected = EXPECTED_ASPECT_ANGLES.get(aspect_name)
        orb = None
        if isinstance(exact_angle, (int, float)) and isinstance(expected, (int, float)):
            orb = abs(exact_angle - expected)
        elif isinstance(aspect.get("orb"), (int, float)):
            orb = abs(float(aspect["orb"]))
        else:
            orb = None

        if orb is None:
            weight = 0.4
        else:
            weight = max(0.1, 1.0 - (orb / 12.0))

        planets = {planet1, planet2}
        name_upper = aspect_name.capitalize()

        if {"Mars", "Jupiter"} <= planets and name_upper in {"Trine", "Sextile"}:
            theme_scores["growth"] = theme_scores.get("growth", 0.0) + 0.6 * weight
            theme_scores["action"] = theme_scores.get("action", 0.0) + 0.3 * weight
        if {"Sun", "Saturn"} <= planets and name_upper in {"Square", "Opposition", "Conjunction"}:
            theme_scores["challenge"] = theme_scores.get("challenge", 0.0) + 0.5 * weight
            theme_scores["structure"] = theme_scores.get("structure", 0.0) + 0.3 * weight
        if {"Moon", "Neptune"} <= planets and name_upper in {"Trine", "Sextile", "Conjunction"}:
            theme_scores["intuition"] = theme_scores.get("intuition", 0.0) + 0.5 * weight
            theme_scores["compassion"] = theme_scores.get("compassion", 0.0) + 0.25 * weight
        if {"Venus", "Pluto"} <= planets:
            theme_scores["love"] = theme_scores.get("love", 0.0) + 0.4 * weight
            theme_scores["depth"] = theme_scores.get("depth", 0.0) + 0.4 * weight
        if {"Mercury", "Uranus"} <= planets:
            theme_scores["innovation"] = theme_scores.get("innovation", 0.0) + 0.35 * weight
        if {"Sun", "Moon"} <= planets:
            theme_scores["integration"] = theme_scores.get("integration", 0.0) + 0.35 * weight

        derived_from.append(
            {
                "pair": pair,
                "aspect": aspect_name,
                "orb": round(float(orb), 2) if orb is not None else None,
            }
        )

    return theme_scores, derived_from


def infer_axis_by_themes_and_pairs(theme_scores: Dict[str, float], derived_from: List[dict]) -> Tuple[str, List[Tuple[str, float]]]:
    """Choose the dominant axis considering theme scores and supporting aspect pairs."""

    def score(key: str) -> float:
        return float(theme_scores.get(key, 0.0))

    axis_scores = {
        "Yay–İkizler": score("growth") + 0.2 * score("intuition") + 0.15 * score("innovation"),
        "Yengeç–Oğlak": score("security") + 0.2 * score("structure") + 0.1 * score("integration"),
        "Terazi–Koç": score("balance") + 0.1 * score("action") + 0.1 * score("love"),
        "Boğa–Akrep": score("value") + 0.2 * score("depth") + 0.1 * score("transformation"),
        "Başak–Balık": score("service") + 0.2 * score("intuition") + 0.1 * score("compassion"),
    }

    for entry in derived_from:
        pair = entry.get("pair")
        if not isinstance(pair, str):
            continue
        if "Mars" in pair and "Jupiter" in pair:
            axis_scores["Yay–İkizler"] += 0.12
        if "Saturn" in pair and "Sun" in pair:
            axis_scores["Yengeç–Oğlak"] += 0.08
        if "Venus" in pair and "Mars" in pair:
            axis_scores["Terazi–Koç"] += 0.08
        if "Venus" in pair and "Pluto" in pair:
            axis_scores["Boğa–Akrep"] += 0.1
        if "Moon" in pair and "Neptune" in pair:
            axis_scores["Başak–Balık"] += 0.12

    ranked = sorted(axis_scores.items(), key=lambda item: item[1], reverse=True)
    best_axis = ranked[0][0] if ranked else "Yay–İkizler"
    return best_axis, ranked


def compose_life_narrative_payload(
    axis: str,
    theme_scores: Dict[str, float],
    focus: str,
    derived_from: List[dict],
    ai_text: str,
    *,
    strategy: str | None = None,
) -> Dict[str, Any]:
    themes_sorted = sorted(theme_scores.items(), key=lambda x: x[1], reverse=True)
    themes = [key for key, _ in themes_sorted[:8]]
    confidence_raw = sum(value for _, value in themes_sorted[:3])
    confidence = None
    if confidence_raw:
        confidence = round(max(0.2, min(0.95, confidence_raw)), 2)

    payload = {
        "version": "v2",
        "axis": axis,
        "themes": themes,
        "focus": focus,
        "derived_from": derived_from[:12],
        "confidence": confidence,
        "strategy": strategy or "primary",
        "text": ai_text,
    }
    return payload

ARCHETYPE_BEHAVIOR_PATTERNS = {
    "sun square saturn": {
        "pattern": "Overachiever wound",
        "expression": "Kendisini kanıtlamak için çabalarken duygusal olarak içe kapanabilir.",
    },
    "moon opposition uranus": {
        "pattern": "Attachment rebellion",
        "expression": "Yakınlık ister ama özgürlüğü tehdit olarak algılar.",
    },
    "mars in cancer retrograde": {
        "pattern": "Passive assertion",
        "expression": "Öfkeyi bastırır, duygusal patlamalar yaşar.",
    },
    "venus in 12th house": {
        "pattern": "Hidden love",
        "expression": "İlişkilerde fedakârlık veya gizlilik teması baskın olabilir.",
    },
    "chiron square saturn": {
        "pattern": "Healing responsibility",
        "expression": "Sorumluluk duygusu, geçmiş yaraları şifalandırma fırsatına dönüşür.",
    },
    "sun conjunction neptune": {
        "pattern": "Idealist visionary",
        "expression": "Gerçeklikten kaçmadan hayallerini somutlaştırmayı öğrenir.",
    },
}


def extract_archetype_data(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract archetypal themes, tone, and notable aspects from natal chart data.

    Parameters
    ----------
    chart_data:
        Dictionary representation of a natal chart. Expected to include an ``aspects``
        iterable with the planetary relationships and optionally a ``planets`` section.

    Returns
    -------
    Dict[str, Any]
        Result with three keys:

        ``core_themes``
            Ordered list of unique themes that describe the chart.
        ``story_tone``
            Short narrative phrase summarising the overarching tone of the chart.
        ``notable_aspects``
            Human-readable list of standout aspects, e.g. ``"Chiron Square Saturn"``.

    Notes
    -----
    The function is intentionally defensive so it can cope with partial or loosely
    structured data that may come from different astrological APIs.
    """
    _validate_chart_input(chart_data)

    core_themes: List[str] = []
    seen_themes = set()
    notable_aspects: List[str] = []

    for aspect in _iter_aspects(chart_data.get("aspects", [])):
        aspect_type = _normalise_aspect_type(aspect)
        planets = _extract_planets(aspect)

        if aspect_type:
            theme = ASPECT_THEMES.get(aspect_type)
            if theme:
                _add_theme(theme, core_themes, seen_themes)

        if len(planets) >= 2 and aspect_type:
            label = f"{planets[0]} {_format_aspect_label(aspect_type)} {planets[1]}"
            notable_aspects.append(label.strip())

        for planet in planets:
            special_theme = SPECIAL_PLANET_THEMES.get(planet.lower())
            if special_theme:
                _add_theme(special_theme, core_themes, seen_themes)

    for planet in _iter_planet_names(chart_data.get("planets", [])):
        broad_theme = BROAD_PLANET_THEMES.get(planet.lower())
        if broad_theme:
            _add_theme(broad_theme, core_themes, seen_themes)

    story_tone = _derive_story_tone(seen_themes)
    behavior_patterns = derive_behavior_patterns(chart_data)

    archetype_base = {
        "core_themes": core_themes,
        "story_tone": story_tone,
        "notable_aspects": notable_aspects,
        "behavior_patterns": behavior_patterns,
    }

    life_layer = integrate_life_expression(chart_data, archetype_data=archetype_base)
    archetype_base.update(life_layer)

    return archetype_base


def _validate_chart_input(chart_data: Any) -> None:
    """Raise a helpful error if the function receives unexpected input."""
    if not isinstance(chart_data, dict):
        raise TypeError("chart_data must be a dictionary parsed from natal chart JSON.")


def _iter_aspects(aspects: Any) -> Iterable[Dict[str, Any]]:
    """Yield aspect dictionaries while filtering out malformed entries."""
    if isinstance(aspects, dict):
        iterable = aspects.values()
    elif isinstance(aspects, Sequence) and not isinstance(aspects, str):
        iterable = aspects
    else:
        return []

    return (aspect for aspect in iterable if isinstance(aspect, dict))


def _normalise_aspect_type(aspect: Dict[str, Any]) -> str | None:
    """Normalise the aspect type to lower-case names such as 'square' or 'trine'."""
    aspect_type = aspect.get("type") or aspect.get("aspect") or aspect.get("name")
    if not isinstance(aspect_type, str):
        return None
    return aspect_type.strip().lower()


def _extract_planets(aspect: Dict[str, Any]) -> List[str]:
    """Pull planet names out of a variety of common aspect formats."""
    planets: List[str] = []

    explicit = aspect.get("planets") or aspect.get("bodies")
    if isinstance(explicit, Sequence) and not isinstance(explicit, str):
        for name in explicit:
            if isinstance(name, str):
                planets.append(name.strip())

    for key in ("planet_1", "planet_2", "body_1", "body_2", "object_1", "object_2"):
        value = aspect.get(key)
        if isinstance(value, str):
            planets.append(value.strip())

    # Remove duplicates while preserving order to keep labels readable.
    seen = set()
    ordered_planets = []
    for planet in planets:
        key = planet.lower()
        if key not in seen and planet:
            seen.add(key)
            ordered_planets.append(planet)
    return ordered_planets


def _iter_planet_names(planets_section: Any) -> Iterable[str]:
    """Yield planet names from the broader planets section of the chart."""
    if isinstance(planets_section, dict):
        return planets_section.keys()

    if isinstance(planets_section, Sequence) and not isinstance(planets_section, str):
        names: List[str] = []
        for entry in planets_section:
            if isinstance(entry, str):
                names.append(entry)
            elif isinstance(entry, dict):
                name = entry.get("name") or entry.get("planet")
                if isinstance(name, str):
                    names.append(name)
        return names

    return []


def _derive_story_tone(themes: Iterable[str]) -> str:
    """Infer the chart's story tone from the collected themes."""
    themes_set = set(themes)

    if {"challenge", "healing"} <= themes_set:
        return "healing through hardship"
    if {"flow", "growth"} <= themes_set:
        return "natural expansion"
    if "transformation" in themes_set:
        return "rebirth and evolution"
    return "balanced growth"


def _add_theme(theme: str, collection: List[str], seen: set[str]) -> None:
    """Add a theme to the collection while maintaining uniqueness and order."""
    if theme not in seen:
        seen.add(theme)
        collection.append(theme)


def _format_aspect_label(aspect_type: str) -> str:
    """Format the aspect type for display in the notable aspects list."""
    return aspect_type.capitalize()


def derive_behavior_patterns(chart_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Infer behavioural patterns based on notable aspects and placements."""
    detected: List[Dict[str, str]] = []
    seen = set()

    aspects = _iter_aspects(chart_data.get("aspects", []))
    for aspect in aspects:
        planet1 = str(aspect.get("planet1") or aspect.get("planet_1") or "").lower()
        planet2 = str(aspect.get("planet2") or aspect.get("planet_2") or "").lower()
        aspect_name = _normalise_aspect_type(aspect) or ""
        aspect_key = f"{planet1} {aspect_name} {planet2}".strip()
        if not aspect_key:
            continue
        for pattern_key, pattern_data in ARCHETYPE_BEHAVIOR_PATTERNS.items():
            if any(keyword in pattern_key for keyword in ("square", "opposition", "conjunction", "trine", "sextile")):
                if pattern_key in aspect_key and pattern_key not in seen:
                    seen.add(pattern_key)
                    detected.append(pattern_data)

    planets_section = chart_data.get("planets") or {}
    if isinstance(planets_section, Sequence) and not isinstance(planets_section, str):
        planets_iterable = []
        for entry in planets_section:
            if isinstance(entry, dict):
                name = entry.get("name") or entry.get("planet")
                if isinstance(name, str):
                    planets_iterable.append((name, entry))
    elif isinstance(planets_section, dict):
        planets_iterable = list(planets_section.items())
    else:
        planets_iterable = []

    for name, details in planets_iterable:
        if not isinstance(details, dict):
            continue
        planet_name = str(name).lower()
        sign = str(details.get("sign") or "").lower()
        house = details.get("house")
        house_str = ""
        if isinstance(house, (int, float)):
            house_str = str(int(house))
        elif isinstance(house, str):
            house_str = "".join(ch for ch in house if ch.isdigit()) or house.lower()
        retrograde = details.get("retrograde") or details.get("is_retrograde")

        for pattern_key, pattern_data in ARCHETYPE_BEHAVIOR_PATTERNS.items():
            if pattern_key in seen:
                continue
            if " in " not in pattern_key or any(
                keyword in pattern_key for keyword in ("square", "opposition", "conjunction", "trine", "sextile")
            ):
                continue
            key_planet, remainder = pattern_key.split(" in ", 1)
            if key_planet != planet_name:
                continue
            remainder = remainder.strip()
            if "house" in remainder:
                expected_house = "".join(ch for ch in remainder if ch.isdigit())
                if expected_house and expected_house == house_str:
                    seen.add(pattern_key)
                    detected.append(pattern_data)
            else:
                expected_sign = remainder.replace("retrograde", "").strip()
                sign_matches = expected_sign and expected_sign in sign
                retrograde_required = "retrograde" in remainder
                retrograde_matches = bool(retrograde) if retrograde_required else True
                if sign_matches and retrograde_matches:
                    seen.add(pattern_key)
                    detected.append(pattern_data)

    return detected


def infer_dominant_axis(archetype_data: Dict[str, Any]) -> str:
    themes = archetype_data.get("core_themes", []) or []
    if "transformation" in themes:
        return "Akrep–Boğa"
    if "healing" in themes:
        return "Balık–Başak"
    if "growth" in themes:
        return "Yay–İkizler"
    return "Kova–Aslan"


def infer_life_focus(themes: List[str], axis: str) -> str:
    if "responsibility" in themes:
        return "kendini disipline ederek dünyada kalıcı bir şey inşa etme"
    if "healing" in themes:
        return "kendini ve başkalarını şifalandırma"
    if "transformation" in themes:
        return "değişimle güçlenme"
    return f"{axis} ekseninde öz ifade ve bilinç yaratma"


def call_ai_model(prompt: str) -> str:
    """Placeholder for the AI life expression generator.

    This implementation extracts key fields from the prompt and returns a deterministic,
    poetic narrative so the system remains functional without external dependencies.
    """
    themes_line = ""
    tone = ""
    axis = ""
    focus = ""

    for raw_line in prompt.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower().startswith("themes:"):
            themes_line = line.split(":", 1)[1].strip()
        elif line.lower().startswith("tone:"):
            tone = line.split(":", 1)[1].strip()
        elif line.lower().startswith("axis:"):
            axis = line.split(":", 1)[1].strip()
        elif line.lower().startswith("focus:"):
            focus = line.split(":", 1)[1].strip()

    themes_text = themes_line or "ruhsal motifler"
    tone_text = tone or "yumuşak dönüşüm"
    axis_text = axis or "Kova–Aslan"
    focus_text = focus or "öz farkındalık"

    return (
        f"{tone_text.capitalize()} bir anlatı seni çağırıyor. {axis_text} hattından yükselen enerji, "
        f"{themes_text} temaları etrafında örülerek {focus_text} yönünde akıyor. "
        "Her gün yeni bir sembol, yeni bir içgörü getiriyor; nefes alırken bu hikâyeyi bedeninde taşıyorsun."
    )


def integrate_life_expression(
    chart_data: Dict[str, Any] | None,
    *,
    archetype_data: Dict[str, Any] | None = None,
    strategy: str | None = None,
) -> Dict[str, Any]:
    """Compose enriched life narrative payload with fallbacks for legacy callers."""

    archetype_data = archetype_data or {}
    core_themes = archetype_data.get("core_themes", []) or []
    tone = archetype_data.get("story_tone", "") or ""

    theme_scores: Dict[str, float] = {}
    derived_from: List[dict] = []
    if chart_data:
        try:
            theme_scores, derived_from = analyze_aspects_weighted(chart_data)
        except Exception:  # pragma: no cover - defensive fallback
            theme_scores, derived_from = {}, []

    if not theme_scores and core_themes:
        theme_scores = {theme: 1.0 for theme in core_themes}

    themes_sorted = list(theme_scores.keys()) or list(core_themes)

    axis_rank = []
    axis = None
    if theme_scores:
        axis, axis_rank = infer_axis_by_themes_and_pairs(theme_scores, derived_from)
    else:
        axis = infer_dominant_axis(archetype_data or {"core_themes": core_themes})

    if strategy == "secondary" and axis_rank and len(axis_rank) > 1:
        axis = axis_rank[1][0]

    focus = infer_life_focus(themes_sorted or core_themes, axis)

    prompt = ["Create a poetic Turkish life narrative."]
    if strategy == "secondary":
        prompt.append("Offer a complementary perspective that highlights the secondary themes.")
    prompt.append(f"Themes: {themes_sorted or core_themes}")
    prompt.append(f"Tone: {tone}")
    prompt.append(f"Axis: {axis}")
    prompt.append(f"Focus: {focus}")
    prompt_text = "\n".join(prompt)

    try:
        life_expression = call_ai_model(prompt_text)
    except Exception as exc:  # pragma: no cover - defensive fallback
        life_expression = (
            "Gökyüzü şu anda sessiz; yine de kalbin sezgisi sana yol gösteriyor. "
            f"{axis} ekseninde, {focus} temasını incelikle dokuyorsun."  # noqa: E501
        )
        life_expression += f" (Hata: {exc})"

    payload = compose_life_narrative_payload(
        axis,
        theme_scores or {theme: 1.0 for theme in themes_sorted or core_themes},
        focus,
        derived_from,
        life_expression,
        strategy=strategy,
    )

    return {
        "life_expression": payload.get("text", ""),
        "dominant_axis": payload.get("axis"),
        "life_focus": payload.get("focus"),
        "life_narrative": payload,
    }


def generate_full_archetype_report(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    base = extract_archetype_data(chart_data)
    base["behavior_patterns"] = derive_behavior_patterns(chart_data)
    if "life_narrative" not in base:
        base.update(integrate_life_expression(chart_data, archetype_data=base))
    return base
