from .extensions import db
from datetime import datetime
import enum
import uuid

class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    retrying = "retrying"

class NotificationRecord(db.Model):
    __tablename__ = "notification_records"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String, unique=True, nullable=False, index=True)
    to_identifier = db.Column(db.String, nullable=False)  # email or push token or user id
    notification_type = db.Column(db.String, nullable=False)  # 'email'|'push'|'update'
    payload = db.Column(db.JSON, nullable=False)
    status = db.Column(db.Enum(NotificationStatus), nullable=False, default=NotificationStatus.pending)
    error_message = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IdempotencyKey(db.Model):
    __tablename__ = "idempotency_keys"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.String, unique=True, nullable=False, index=True)
    response_payload = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
