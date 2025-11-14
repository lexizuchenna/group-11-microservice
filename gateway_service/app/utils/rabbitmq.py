import pika
import json
import logging
from urllib.parse import urlparse
from flask import current_app
from pika.adapters.blocking_connection import BlockingConnection
from pika.exceptions import AMQPConnectionError

logger = logging.getLogger(__name__)

class RabbitPublisher:
    def __init__(self, amqp_url, exchange_name):
        self.amqp_url = amqp_url
        self.exchange = exchange_name
        self._connection = None
        self._channel = None
        self._connect()

    def _connect(self):
        try:
            params = pika.URLParameters(self.amqp_url)
            self._connection = BlockingConnection(params)
            self._channel = self._connection.channel()
            # declare exchange (durable)
            self._channel.exchange_declare(exchange=self.exchange, exchange_type='direct', durable=True)
            logger.info("Connected to RabbitMQ")
        except AMQPConnectionError as ex:
            logger.exception("Failed to connect to RabbitMQ: %s", ex)
            raise

    def _ensure_channel(self):
        if not self._connection or self._connection.is_closed:
            self._connect()

    def publish(self, routing_key, message_body: dict, request_id: str, headers: dict = None, persistent=True):
        self._ensure_channel()
        properties = pika.BasicProperties(
            delivery_mode=2 if persistent else 1,
            content_type='application/json',
            correlation_id=request_id,
            headers=headers or {}
        )
        body = json.dumps(message_body)
        self._channel.basic_publish(
            exchange=self.exchange,
            routing_key=routing_key,
            body=body,
            properties=properties
        )
        logger.debug("Published to exchange=%s routing_key=%s request_id=%s", self.exchange, routing_key, request_id)

# convenience factory reading from app config
def get_publisher(app):
    from flask import current_app
    return RabbitPublisher(amqp_url=app.config['RABBITMQ_URL'], exchange_name=app.config['RABBITMQ_EXCHANGE'])
