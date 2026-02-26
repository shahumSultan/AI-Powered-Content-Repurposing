from fastapi import FastAPI

from backend.routers import ingest

app = FastAPI(title="AI-Powered Content Repurposing", version="0.1.0")

app.include_router(ingest.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
