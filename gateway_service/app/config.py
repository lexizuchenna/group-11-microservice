import os

class BaseConfig:
    DEBUG = False
    TESTING = False

    # Database (Postgres)
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/gateway_db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # RabbitMQ
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqps://user:pass@rabbitmq-host:5672/%2F")
    RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "notifications.direct")
    EMAIL_ROUTING_KEY = os.getenv("EMAIL_ROUTING_KEY", "notifications.email")
    PUSH_ROUTING_KEY = os.getenv("PUSH_ROUTING_KEY", "notifications.push")
    UPDATE_ROUTING_KEY = os.getenv("UPDATE_ROUTING_KEY", "notifications.update")
    DEADLETTER_ROUTING_KEY = os.getenv("DEADLETTER_ROUTING_KEY", "notifications.failed")

    # Idempotency / Auth
    IDP_EXPIRY_SECONDS = int(os.getenv("IDP_EXPIRY_SECONDS", "86400"))  # how long to keep request_id
    GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "supersecretapikey")
    USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:3000/user_service_url")
    TEMPLATE_SERVICE_URL = os.getenv("TEMPLATE_SERVICE_URL", "http://localhost:3000/template_service_url")

    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Swagger
    SWAGGER = {
        "title": "Notification Gateway API",
        "uiversion": 3
    }

class DevelopmentConfig(BaseConfig):
    DEBUG = True
