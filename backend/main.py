import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter

from routers import billing, blog, generate, youtube
from routers import auth, user, trial
from services import generator

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    generator.load_model()
    yield


app = FastAPI(
    title="AI-Powered Content Repurposing",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://content-cube-enigma-cube.vercel.app",
)
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(trial.router)
app.include_router(billing.router)
app.include_router(youtube.router)
app.include_router(blog.router)
app.include_router(generate.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict:
    from fastapi import HTTPException
    if not generator.is_ready():
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "ready"}
