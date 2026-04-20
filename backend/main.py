import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://ai-powered-content-repurposing.vercel.app",
)
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
