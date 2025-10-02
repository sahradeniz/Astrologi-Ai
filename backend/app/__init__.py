"""Application factory for the Flask backend."""
import os

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, ServiceUnavailable

from .routes import api_blueprint


def create_app(config_object: str | None = None) -> Flask:
    """Create and configure the Flask application."""

    app = Flask(__name__)

    # Base configuration
    app.config.from_mapping(
        SECRET_KEY="change-me",
        JSON_SORT_KEYS=False,
    )

    app.config["ASTROLOGY_API_BASE_URL"] = os.environ.get(
        "ASTROLOGY_API_BASE_URL", ""
    )
    app.config["ASTROLOGY_API_KEY"] = os.environ.get("ASTROLOGY_API_KEY")
    try:
        timeout = float(os.environ.get("ASTROLOGY_API_TIMEOUT", "10"))
    except (TypeError, ValueError):  # pragma: no cover - defensive guard
        timeout = 10.0
    app.config["ASTROLOGY_API_TIMEOUT"] = timeout

    if config_object:
        app.config.from_object(config_object)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(api_blueprint, url_prefix="/api")

    @app.errorhandler(BadRequest)
    def handle_bad_request(exc: BadRequest):  # type: ignore[override]
        response = {"error": exc.description or "İstek geçersiz."}
        return jsonify(response), exc.code or 400

    @app.errorhandler(ServiceUnavailable)
    def handle_service_unavailable(exc: ServiceUnavailable):  # type: ignore[override]
        response = {"error": exc.description or "Servis şu anda kullanılamıyor."}
        return jsonify(response), exc.code or 503

    @app.get("/api/health")
    def health_check() -> dict[str, str]:
        """Simple health-check endpoint for uptime monitoring."""

        return {"status": "ok"}

    return app
