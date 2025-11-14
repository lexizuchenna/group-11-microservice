# app/utils/circuit_breaker.py
import pybreaker
import logging

logger = logging.getLogger(__name__)

rabbit_breaker = pybreaker.CircuitBreaker(
    fail_max=5,
    reset_timeout=30,
    name="rabbitmq_breaker"
)

def rabbit_publish_with_breaker(publisher, routing_key, body, request_id, headers=None):
    try:
        @rabbit_breaker
        def _publish():
            return publisher.publish(routing_key, body, request_id, headers=headers)
        return _publish()
    except pybreaker.CircuitBreakerError:
        logger.error("Circuit breaker open for RabbitMQ")
        raise
