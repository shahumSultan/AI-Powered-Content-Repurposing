import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "")
if not DATABASE_URL and os.getenv("ENV", "development") == "production":
    raise RuntimeError("DATABASE_URL environment variable must be set")

JWT_SECRET: str = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    import warnings
    warnings.warn("JWT_SECRET is not set — using insecure default. Set this in production.")
    JWT_SECRET = "dev-secret-change-in-production"

JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "168"))

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_BEGINNER_PRICE_ID: str = os.getenv("STRIPE_BEGINNER_PRICE_ID", "")
STRIPE_PRO_PRICE_ID: str = os.getenv("STRIPE_PRO_PRICE_ID", "")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

# Encryption key for storing user API keys at rest.
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
API_KEY_ENCRYPTION_KEY: str = os.getenv("API_KEY_ENCRYPTION_KEY", "")

RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@contentcube.app")
RESEND_TEMPLATE_ID: str = os.getenv("RESEND_TEMPLATE_ID", "")
