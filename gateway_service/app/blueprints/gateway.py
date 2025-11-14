from flask import Blueprint, current_app, request, jsonify
from ..extensions import db
from ..models import NotificationRecord, NotificationStatus
from ..utils.rabbitmq import get_publisher
from ..utils.idempotency import check_idempotency, set_idempotency
from ..utils.circuit_breaker import rabbit_publish_with_breaker
from sqlalchemy.exc import SQLAlchemyError
from flasgger import swag_from
import uuid
import datetime
from ..models import IdempotencyKey

gateway_bp = Blueprint("gateway", __name__)

def api_response(success: bool, message: str, data=None, error=None, meta=None):
    payload = {
        "success": success,
        "message": message,
        "data": data,
        "error": error,
        "meta": meta or {}
    }
    return jsonify(payload)

def _choose_routing_key(notification_type):
    cfg = current_app.config
    if notification_type == "email":
        return cfg['EMAIL_ROUTING_KEY']
    if notification_type == "push":
        return cfg['PUSH_ROUTING_KEY']
    if notification_type == "update":
        return cfg['UPDATE_ROUTING_KEY']
    raise ValueError("unknown notification_type")

@gateway_bp.route("/notifications", methods=["POST"])
@swag_from({
    'tags': ['gateway'],
    'parameters': [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "request_id": {"type": "string"},
                    "notification_type": {"type": "string", "enum": ["email","push","update"]},
                    "to": {"type": "string"},
                    "template_id": {"type": "string"},
                    "payload": {"type": "object"}
                },
                "required": ["request_id","notification_type","to","payload"]
            }
        }
    ],
    'responses': {
        200: {
            "description": "Accepted",
            "schema": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                }
            }
        }
    }
})
def notify():
    # Basic auth via header token (example)
    api_key = request.headers.get("x-api-key")
    if not api_key or api_key != current_app.config.get("GATEWAY_API_KEY"):
        return api_response(False, "Unauthorized", error="invalid_api_key"), 401

    body = request.get_json(force=True, silent=True)
    if not body:
        return api_response(False, "Bad request", error="invalid_json"), 400

    request_id = body.get("request_id") or str(uuid.uuid4())
    notification_type = body.get("notification_type")
    to_identifier = body.get("to")
    template_id = body.get("template_id")
    payload = body.get("payload") or {}

    if not notification_type or notification_type not in ("email", "push", "update"):
        return api_response(False, "Invalid notification_type", error="invalid_notification_type"), 400
    if not to_identifier:
        return api_response(False, "Missing recipient 'to'"), 400

    # Idempotency check
    session = db.session
    found, existing_response = check_idempotency(session, request_id)
    if found:
        session.commit()
        return api_response(True, "Idempotent request - returning previous response", data=existing_response), 200

    # create NotificationRecord
    record = NotificationRecord(
        request_id=request_id,
        to_identifier=to_identifier,
        notification_type=notification_type,
        payload={"template_id": template_id, "payload": payload},
        status=NotificationStatus.pending
    )
    try:
        session.add(record)
        # reserve idempotency key
        set_idempotency(session, request_id, response_payload={"request_id": request_id, "status": "queued"})
        session.commit()
    except SQLAlchemyError as ex:
        session.rollback()
        return api_response(False, "DB error", error=str(ex)), 500

    # Build message
    message = {
        "request_id": request_id,
        "to": to_identifier,
        "notification_type": notification_type,
        "template_id": template_id,
        "payload": payload,
        "created_at": datetime.datetime.utcnow().isoformat() + "Z",
    }

    routing_key = _choose_routing_key(notification_type)
    publisher = get_publisher(current_app)

    try:
        # Use circuit breaker wrapper
        rabbit_publish_with_breaker(publisher, routing_key, message, request_id,
                                    headers={"notification_type": notification_type})
    except Exception as ex:
        # if publish failed: update record and respond with error or queue locally
        try:
            record.status = NotificationStatus.failed
            record.error_message = str(ex)
            session.commit()
        except Exception:
            session.rollback()
        return api_response(False, "Failed to publish to message queue", error=str(ex)), 503

    # Success -> update record
    try:
        record.status = NotificationStatus.pending
        session.commit()
    except Exception:
        session.rollback()

    response_body = {
        "request_id": request_id,
        "status": "queued"
    }

    # update idempotency payload
    try:
        # update stored idempotency response
        key = session.query(IdempotencyKey).filter_by(request_id=request_id).first()
        if key:
            key.response_payload = response_body
            session.commit()
    except Exception:
        session.rollback()

    return api_response(True, "Notification queued", data=response_body), 200

@gateway_bp.route("/health", methods=["GET"])
def health():
    # Basic health checks: db and rabbit connectivity
    checks = {"status": "ok"}
    # db health check
    try:
        db.session.execute("SELECT 1")
        checks['db'] = 'ok'
    except Exception as ex:
        checks['db'] = f"error: {ex}"

    # rabbit health check
    try:
        from ..utils.rabbitmq import RabbitPublisher
        pub = RabbitPublisher(current_app.config['RABBITMQ_URL'], current_app.config['RABBITMQ_EXCHANGE'])
        checks['rabbitmq'] = 'ok'
        pub._connection.close()
    except Exception as ex:
        checks['rabbitmq'] = f"error: {ex}"

    return api_response(True, "health check", data=checks)
