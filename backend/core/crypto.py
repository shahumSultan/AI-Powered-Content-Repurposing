"""
Encrypt/decrypt user-supplied API keys stored in the database.
If API_KEY_ENCRYPTION_KEY is not set the values are stored as-is (dev only).
"""
from core.config import API_KEY_ENCRYPTION_KEY

_fernet = None

if API_KEY_ENCRYPTION_KEY:
    from cryptography.fernet import Fernet
    _fernet = Fernet(API_KEY_ENCRYPTION_KEY.encode())


def encrypt(value: str | None) -> str | None:
    if not value:
        return value
    if not _fernet:
        return value
    return _fernet.encrypt(value.encode()).decode()


def decrypt(value: str | None) -> str | None:
    if not value:
        return value
    if not _fernet:
        return value
    try:
        return _fernet.decrypt(value.encode()).decode()
    except Exception:
        return value
