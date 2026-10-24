import hmac
import secrets
import time

# TODO: change these before real client use.
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

SESSION_TTL = 60 * 60 * 24 * 7  # 7 days

_sessions = {}  # token -> expiry timestamp


def verify_login(username, password):
    return hmac.compare_digest(username, ADMIN_USERNAME) and hmac.compare_digest(password, ADMIN_PASSWORD)


def create_session():
    token = secrets.token_urlsafe(32)
    _sessions[token] = time.time() + SESSION_TTL
    return token


def validate_session(token):
    if not token:
        return False
    exp = _sessions.get(token)
    if not exp:
        return False
    if time.time() > exp:
        _sessions.pop(token, None)
        return False
    return True


def destroy_session(token):
    _sessions.pop(token, None)
