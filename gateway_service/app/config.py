import os
from dotenv import load_dotenv

class BaseConfig:
    load_dotenv()
    
    DEBUG = False
    TESTING = False

    # Database (Postgres)
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # RabbitMQ
    RABBITMQ_URL = os.getenv("RABBITMQ_URL")
    RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE")
    EMAIL_ROUTING_KEY = os.getenv("EMAIL_ROUTING_KEY")
    PUSH_ROUTING_KEY = os.getenv("PUSH_ROUTING_KEY")
    UPDATE_ROUTING_KEY = os.getenv("UPDATE_ROUTING_KEY")
    DEADLETTER_ROUTING_KEY = os.getenv("DEADLETTER_ROUTING_KEY")

    # Idempotency / Auth
    IDP_EXPIRY_SECONDS = int(os.getenv("IDP_EXPIRY_SECONDS", "86400"))  # how long to keep request_id
    GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY")
    USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")
    TEMPLATE_SERVICE_URL = os.getenv("TEMPLATE_SERVICE_URL", "http://localhost:3000/template_service_url")

    # Redis
    REDIS_URL = os.getenv("REDIS_URL")

    # Swagger
    SWAGGER = {
        "title": "Notification Gateway API",
        "uiversion": 1
    }

class DevelopmentConfig(BaseConfig):
    DEBUG = True
