"""Utility to derive archetypal themes from natal chart data."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Sequence

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

    return {
        "core_themes": core_themes,
        "story_tone": story_tone,
        "notable_aspects": notable_aspects,
    }


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
