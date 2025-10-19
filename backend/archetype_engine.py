"""Utility to derive archetypal themes from natal chart data."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Sequence

__all__ = [
    "extract_archetype_data",
    "derive_behavior_patterns",
    "integrate_life_expression",
    "generate_full_archetype_report",
]
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

    life_layer = integrate_life_expression(archetype_base)
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


def integrate_life_expression(archetype_data: Dict[str, Any]) -> Dict[str, Any]:
    themes = archetype_data.get("core_themes", []) or []
    tone = archetype_data.get("story_tone", "") or ""
    axis = infer_dominant_axis(archetype_data)
    focus = infer_life_focus(themes, axis)
    prompt = (
        "Create a poetic Turkish life narrative.\n"
        f"Themes: {themes}\n"
        f"Tone: {tone}\n"
        f"Axis: {axis}\n"
        f"Focus: {focus}\n"
    )
    try:
        life_expression = call_ai_model(prompt)
    except Exception as exc:  # pragma: no cover - defensive fallback
        life_expression = (
            "Gökyüzü şu anda sessiz; yine de kalbin sezgisi sana yol gösteriyor. "
            f"{axis} ekseninde, {focus} temasını incelikle dokuyorsun."
        )
        life_expression += f" (Hata: {exc})"
    return {
        "life_expression": life_expression,
        "dominant_axis": axis,
        "life_focus": focus,
    }


def generate_full_archetype_report(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    base = extract_archetype_data(chart_data)
    base["behavior_patterns"] = derive_behavior_patterns(chart_data)
    base.update(integrate_life_expression(base))
    return base
