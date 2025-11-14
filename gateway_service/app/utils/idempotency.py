from . import db  # do not circular import; use SQLAlchemy session via app
from ..models import IdempotencyKey, NotificationRecord
from datetime import datetime, timedelta

def check_idempotency(session, request_id):
    # returns (found, response_payload)
    existing = session.query(IdempotencyKey).filter_by(request_id=request_id).first()
    if existing:
        return True, existing.response_payload
    return False, None

def set_idempotency(session, request_id, response_payload=None):
    key = IdempotencyKey(request_id=request_id, response_payload=response_payload)
    session.add(key)
    session.flush()
    return key
