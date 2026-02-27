# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running the Backend

```bash
# From repo root, with .venv active
uvicorn backend.main:app --reload
```

API docs available at `http://localhost:8000/docs`.

## Architecture

The backend is a FastAPI application under `backend/`:

- `backend/main.py` — creates the `FastAPI` app and registers routers
- `backend/routers/youtube.py` — `POST /ingest/youtube`
- `backend/routers/blog.py` — `POST /ingest/blog`
- `backend/routers/generate.py` — `POST /generate` (full pipeline)
- `backend/schemas/ingest.py` — Pydantic models for the ingest layer
- `backend/schemas/generate.py` — Pydantic models for the generate layer
- `backend/services/` — pipeline services (chunker, embedder, ranker, generator, exporter)

### Ingestion Layer (`/ingest`)

| Endpoint | Input | Output |
|---|---|---|
| `POST /ingest/youtube` | `{ "url": "<youtube-url>" }` | `{ video_id, transcript: [{text, start, duration}] }` |
| `POST /ingest/blog` | `{ "url": "<article-url>" }` | `{ title, text }` |

**YouTube** uses `youtube-transcript-api` to fetch timestamped transcripts.
**Blog** uses `trafilatura` to fetch and clean article text from any URL.

### Generation Layer (`/generate`)

| Endpoint | Input | Output |
|---|---|---|
| `POST /generate` | `{ "urls": ["<url>", ...] }` | `{ content_pack, errors, export_json, export_csv }` |

Pipeline: ingest each URL → chunk (400–900 words) → embed (`all-MiniLM-L6-v2`) → semantic dedup + rank → local GGUF model generates content pack → CSV/JSON export.

`content_pack` contains: 10 hooks, 5 LinkedIn posts, 10 Twitter/X posts, 5 IG captions, 10 Shorts ideas (with YouTube timestamps where available).

#### ML model — local GGUF via llama-cpp-python

- Loaded lazily on first request inside `backend/services/generator.py`
- **No HuggingFace account or API key required** — model runs fully locally
- Place your `.gguf` file in `models/` and set `MODEL_PATH` in `.env`:
  ```bash
  cp .env.example .env
  # edit .env → MODEL_PATH=models/your-model.gguf
  ```
- GPU is used automatically when available (`n_gpu_layers=-1`); falls back to CPU with no config change
- First request loads the model (~2–10 s); subsequent requests are fast
- If the model file is missing or inference fails, a stub fallback is returned automatically

## Frontend

Next.js 16 app under `frontend/` (TypeScript, Tailwind v4, App Router).

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Run backend and frontend concurrently in separate terminals. The frontend calls
`http://localhost:8000` directly; CORS is configured in `backend/main.py` to allow
`http://localhost:3000`.

### Key files
- `frontend/app/page.tsx` — root page: GenerateForm (primary) + IngestTabs (collapsible)
- `frontend/components/GenerateForm.tsx` — multi-URL textarea → calls `/generate`
- `frontend/components/ContentPackView.tsx` — tabbed display of all 5 content types + CSV/JSON export
- `frontend/components/IngestTabs.tsx` — YouTube / Blog tab switcher (dev/debug)
- `frontend/components/YouTubeForm.tsx` — YouTube URL input + transcript display
- `frontend/components/BlogForm.tsx` — Blog URL input + article display
- `frontend/lib/api.ts` — typed fetch wrappers for all endpoints
