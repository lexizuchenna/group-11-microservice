from flask import Flask
from .config import DevelopmentConfig, BaseConfig
from .extensions import db, swagger
from .blueprints.gateway import gateway_bp
import logging

def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(config_object or DevelopmentConfig)

    # initialize extensions
    db.init_app(app)
    swagger.init_app(app)

    # register blueprints
    app.register_blueprint(gateway_bp, url_prefix="/api/v1")

    # logging
    logging.basicConfig(level=logging.INFO)
    return app
