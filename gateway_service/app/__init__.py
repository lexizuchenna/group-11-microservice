from flask import Flask
from dotenv import load_dotenv
from .config import DevelopmentConfig, BaseConfig
from .extensions import db, swagger
from .blueprints.gateway import gateway_bp
import logging
import os

def create_app(config_object=None):
    load_dotenv()

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
