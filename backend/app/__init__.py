"""Application factory for the Flask backend."""
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest

from .routes import api_blueprint


def create_app(config_object: str | None = None) -> Flask:
    """Create and configure the Flask application."""

    app = Flask(__name__)

    # Base configuration
    app.config.from_mapping(
        SECRET_KEY="change-me",
        JSON_SORT_KEYS=False,
    )

    if config_object:
        app.config.from_object(config_object)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(api_blueprint, url_prefix="/api")

    @app.errorhandler(BadRequest)
    def handle_bad_request(exc: BadRequest):  # type: ignore[override]
        response = {"error": exc.description or "İstek geçersiz."}
        return jsonify(response), exc.code or 400

    @app.get("/api/health")
    def health_check() -> dict[str, str]:
        """Simple health-check endpoint for uptime monitoring."""

        return {"status": "ok"}

    return app
