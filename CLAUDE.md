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
- `backend/routers/ingest.py` — ingestion endpoints (`/ingest/youtube`, `/ingest/blog`)
- `backend/schemas/ingest.py` — Pydantic request/response models for the ingest layer

### Ingestion Layer (`/ingest`)

| Endpoint | Input | Output |
|---|---|---|
| `POST /ingest/youtube` | `{ "url": "<youtube-url>" }` | `{ video_id, transcript: [{text, start, duration}] }` |
| `POST /ingest/blog` | `{ "url": "<article-url>" }` | `{ title, text }` |

**YouTube** uses `youtube-transcript-api` to fetch timestamped transcripts.
**Blog** uses `trafilatura` to fetch and clean article text from any URL.

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
- `frontend/app/page.tsx` — root page, renders `<IngestTabs />`
- `frontend/components/IngestTabs.tsx` — YouTube / Blog tab switcher
- `frontend/components/YouTubeForm.tsx` — YouTube URL input + transcript display
- `frontend/components/BlogForm.tsx` — Blog URL input + article display
- `frontend/lib/api.ts` — typed fetch wrappers for both ingest endpoints
