from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import blog, generate, youtube

app = FastAPI(title="AI-Powered Content Repurposing", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(youtube.router)
app.include_router(blog.router)
app.include_router(generate.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
