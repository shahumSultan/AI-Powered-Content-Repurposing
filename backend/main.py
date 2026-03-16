import os
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import blog, generate, youtube
from services import generator
# from backend.routers import blog, generate, youtube
# from backend.services import generator

load_dotenv()  # loads .env from the repo root

@asynccontextmanager
async def lifespan(_app: FastAPI):
    generator.load_model()   # blocks until model is loaded (or fails gracefully)
    yield                    # server is now running


app = FastAPI(
    title="AI-Powered Content Repurposing",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(youtube.router)
app.include_router(blog.router)
app.include_router(generate.router)


@app.get("/health")
def health() -> dict:
    """Always returns OK — does not touch the LLM."""
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict:
    """Returns OK only if the LLM has been loaded. Use this for readiness probes."""
    if not generator.is_ready():
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "ready"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)