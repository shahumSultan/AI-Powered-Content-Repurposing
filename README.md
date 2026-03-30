# ContentFlow

**Turn any YouTube video or blog article into a full social media content pack — in seconds.**

ContentFlow is an AI-powered content repurposing tool. Paste one or more URLs, and the pipeline extracts, chunks, embeds, deduplicates, ranks, and generates platform-ready content using Groq cloud inference.

---

## What It Produces

From a single run across your URLs, ContentFlow generates:

| Format | Count |
|---|---|
| Attention-grabbing hooks | 5 |
| LinkedIn posts (90–140 words, CTA included) | 2 |
| Instagram captions (30–60 words, 3 hashtags) | 5 |
| YouTube Shorts ideas (with timestamps) | 3 |

All output is available as **CSV** and **JSON** export.

---

## Tech Stack

### Backend
- **FastAPI** — REST API
- **youtube-transcript-api** — Timestamped YouTube transcript extraction
- **trafilatura** — Blog/article scraping and cleaning
- **scikit-learn** — TF-IDF embedding for semantic deduplication
- **Groq** (`llama-3.3-70b-versatile`) — Cloud LLM inference

### Frontend
- **Next.js 16** — App Router, React 19
- **TypeScript**
- **Tailwind CSS v4**

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

---

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd AI-Powered-Content-Repurposing
```

### 2. Backend

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment

```bash
cp .env.example .env
# Edit .env and set:
# GROQ_API_KEY=your-key-here
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Running the App

Run the backend and frontend in **separate terminals**:

```bash
# Terminal 1 — backend (from repo root, .venv active)
uvicorn backend.main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
# App available at http://localhost:3000
```

---

## Project Structure

```
.
├── backend/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── routers/
│   │   ├── youtube.py           # POST /ingest/youtube
│   │   ├── blog.py              # POST /ingest/blog
│   │   └── generate.py          # POST /generate (full pipeline)
│   ├── schemas/
│   │   ├── ingest.py            # Pydantic models for ingestion layer
│   │   └── generate.py          # Pydantic models for generation layer
│   └── services/
│       ├── chunker.py           # 400–900 word semantic chunking
│       ├── embedder.py          # TF-IDF embedding
│       ├── ranker.py            # Cosine dedup + diversity ranking
│       ├── generator.py         # Groq inference + stub fallback
│       ├── utils.py             # Shared utilities (YouTube ID extraction)
│       └── exporter.py          # CSV / JSON export
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page (Navbar + all sections)
│   │   ├── layout.tsx           # Root layout, Geist font, metadata
│   │   └── globals.css          # Tailwind v4, keyframes, custom utilities
│   ├── components/
│   │   ├── Navbar.tsx           # Sticky nav with scroll-opacity transition
│   │   ├── HeroSection.tsx      # Full-viewport hero with animated orbs
│   │   ├── FeaturesSection.tsx  # 3-column feature cards
│   │   ├── HowItWorksSection.tsx # Numbered 3-step pipeline
│   │   ├── TryItSection.tsx     # Live demo (browser-chrome frame)
│   │   ├── PricingSection.tsx   # 3-tier pricing (Free / Creator / Agency)
│   │   ├── AnimateOnScroll.tsx  # IntersectionObserver scroll-fade wrapper
│   │   ├── GenerateForm.tsx     # Multi-URL input → calls /generate
│   │   ├── ContentPackView.tsx  # Tabbed content pack display + export
│   │   ├── IngestTabs.tsx       # Dev tool: YouTube / Blog ingestion test
│   │   ├── YouTubeForm.tsx      # Transcript preview (dev)
│   │   └── BlogForm.tsx         # Article preview (dev)
│   └── lib/
│       └── api.ts               # Typed fetch wrappers for all endpoints
├── models/                      # Place your .gguf file here (gitignored)
├── .env.example                 # MODEL_PATH template
├── .gitignore
├── requirements.txt
└── CLAUDE.md                    # Dev guidance for Claude Code
```

---

## API Reference

### `POST /ingest/youtube`

Extracts a timestamped transcript from a YouTube URL.

```json
// Request
{ "url": "https://youtube.com/watch?v=..." }

// Response
{
  "video_id": "abc123",
  "transcript": [
    { "text": "Hello world", "start": 0.0, "duration": 2.5 },
    ...
  ]
}
```

### `POST /ingest/blog`

Scrapes and cleans the text from any blog or article URL.

```json
// Request
{ "url": "https://example.com/article" }

// Response
{ "title": "Article Title", "text": "Clean article body..." }
```

### `POST /generate`

Runs the full pipeline on one or more URLs and returns a content pack.

```json
// Request
{ "urls": ["https://youtube.com/...", "https://example.com/blog"] }

// Response
{
  "content_pack": {
    "hooks":          [{ "text": "..." }, ...],
    "linkedin_posts": [{ "text": "..." }, ...],
    "ig_captions":    [{ "text": "..." }, ...],
    "shorts_ideas":   [{ "title": "...", "what_to_say": "...", "timestamp_start": 42, "timestamp_end": 98 }, ...]
  },
  "errors": [],
  "export_json": { ... },
  "export_csv": "type,index,text,timestamp_start,timestamp_end\n..."
}
```

Per-URL errors are non-fatal — they appear in `errors[]` while successfully processed URLs still contribute to the pack. A `422` is only raised if **all** URLs fail.

---

## Generation Pipeline

```
URLs
 ↓
Ingest (youtube-transcript-api / trafilatura)
 ↓
Chunk (400–900 words, preserving timestamps)
 ↓
Embed (TF-IDF, 512 features)
 ↓
Deduplicate (greedy cosine similarity, threshold 0.85)
 ↓
Rank (most semantically unique chunks first)
 ↓
Generate (Groq — llama-3.3-70b-versatile)
 ↓
Export (CSV + JSON)
```

If inference fails for any reason, a stub fallback is returned automatically — the API never returns a 500 due to model errors.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for LLM inference |
| `NEXT_PUBLIC_API_URL` | No | Backend URL (defaults to `http://localhost:8000`) |

---

## Pricing Tiers (in-app)

| Tier | Price | Highlights |
|---|---|---|
| Beginner | $7/mo | 5 packs/month, all formats, CSV + JSON |
| Pro | $14/mo | Unlimited generations, multiple URLs, priority support |

---

## Development Notes

- CORS is configured in `backend/main.py` to allow `http://localhost:3000`
- The frontend calls `http://localhost:8000` directly (configured in `frontend/lib/api.ts`)
- Tailwind v4 is used — all class names must appear as **complete string literals** in source (no dynamic class construction)
- The `models/` directory is tracked via `.gitkeep` but `.gguf` files are gitignored

---

## Built By

**Enigma-Cube** — © 2026
