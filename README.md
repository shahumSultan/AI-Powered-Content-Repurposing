# ContentFlow

> **AI-powered content repurposing SaaS — turn YouTube videos and blog articles into platform-ready social media content in seconds.**

Paste one or more URLs (or drop in raw text / an audio file), and ContentFlow extracts, chunks, embeds, deduplicates, ranks, and generates a full content pack using Groq cloud inference. Ships with JWT auth, Stripe subscriptions, a user dashboard, generation history, and BYO API key support.

---

## What It Produces

From a single run, ContentFlow generates:

| Format | Count |
|---|---|
| Attention-grabbing hooks | 5 |
| LinkedIn posts (90–140 words, CTA included) | 2 |
| Instagram captions (30–60 words, 3 hashtags) | 5 |
| YouTube Shorts ideas (with timestamps) | 3 |

All output is available as **CSV** and **JSON** export.

---

## Features

### Core Pipeline
- **Multi-input ingestion** — YouTube URLs (via Supadata + fallback), blog/article URLs, raw text paste, and audio file upload
- **Semantic chunking** — 400–900 word chunks with timestamp preservation for YouTube content
- **TF-IDF deduplication** — greedy cosine-similarity dedup (threshold 0.85) before generation
- **Groq inference** — `llama-3.3-70b-versatile` with automatic stub fallback if the API call fails
- **Free-form mode** — skip the structured pack and generate anything with a custom prompt (Pro)
- **Custom prompt template** — save a reusable system prompt in settings (Pro)

### Auth & Accounts
- Email + password authentication with JWT (HttpOnly cookies)
- Secure password requirements enforced on registration
- Profile management (name, email)

### Subscriptions & Billing
- **Stripe** integration — Beginner and Pro plans
- Free trial (3 generations, no card required)
- Monthly generation limits enforced per plan; admins bypass quota
- Customer portal for self-serve plan changes and cancellations
- Stripe webhook handling for subscription lifecycle events

### User Dashboard
- **Generate** — main content creation page with live limit counter
- **History** — browse and re-open past content packs (persisted to PostgreSQL)
- **Insights** — usage analytics
- **Settings** — BYO Groq/OpenAI API keys (stored AES-encrypted at rest), preferred provider, custom prompt template
- **Billing** — current plan, upgrade/downgrade, Stripe portal link
- **Profile** — edit display name
- Plan status badge in sidebar
- Mobile-responsive layout with bottom navigation bar

### Operations & Security
- SSRF protection on URL inputs
- Rate limiting on all endpoints
- API key encryption at rest (Fernet/AES)
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- JWT hardening (expiry, secret rotation support)
- Admin panel with user overview
- Maintenance mode (toggle via env var)
- Docker + Docker Compose for local dev
- Vercel Web Analytics

---

## Tech Stack

### Backend
- **FastAPI** — async REST API
- **PostgreSQL** + **SQLAlchemy** (async) + **Alembic** — database and migrations
- **Stripe SDK** — subscription billing
- **youtube-transcript-api** + **Supadata API** — timestamped YouTube transcript extraction
- **trafilatura** — blog/article scraping and cleaning
- **scikit-learn** — TF-IDF embedding and cosine similarity
- **Groq** (`llama-3.3-70b-versatile`) — cloud LLM inference
- **cryptography (Fernet)** — API key encryption
- **slowapi** — rate limiting

### Frontend
- **Next.js** — App Router, React 19, Server Components
- **TypeScript**
- **Tailwind CSS v4**
- **Vercel** — deployment + Web Analytics

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL database (Railway, Supabase, or local Docker)
- A Groq API key — free at [console.groq.com](https://console.groq.com)
- Stripe account (for billing features)

---

## Setup

### 1. Clone

```bash
git clone https://github.com/shahumSultan/AI-Powered-Content-Repurposing.git
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
# Fill in the values — see Environment Variables below
```

### 4. Database

```bash
alembic upgrade head
```

### 5. Frontend

```bash
cd frontend
npm install
```

---

## Running the App

Run backend and frontend in **separate terminals**:

```bash
# Terminal 1 — backend (repo root, .venv active)
uvicorn backend.main:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
# App: http://localhost:3000
```

### Docker (optional)

```bash
docker compose up --build
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GROQ_API_KEY` | Yes | Groq API key for LLM inference |
| `STRIPE_SECRET_KEY` | Yes (billing) | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes (billing) | Stripe webhook signing secret |
| `STRIPE_BEGINNER_PRICE_ID` | Yes (billing) | Stripe Price ID for Beginner plan |
| `STRIPE_PRO_PRICE_ID` | Yes (billing) | Stripe Price ID for Pro plan |
| `FRONTEND_URL` | Yes | Full URL of the frontend (for Stripe redirects) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `API_KEY_ENCRYPTION_KEY` | Yes | Fernet key for encrypting user API keys — generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `SUPADATA_API_KEY` | No | Supadata API key for reliable YouTube transcript fetching |
| `PORT` | No | Server port (default `8000`; Railway sets this automatically) |
| `JWT_EXPIRE_HOURS` | No | JWT lifetime in hours (default `168` = 7 days) |

### Frontend (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (defaults to `http://localhost:8000`) |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | No | Set to `true` to show the maintenance page |
| `INTERNAL_API_URL` | No | Internal backend URL for server-side fetches (e.g. Railway private networking) |
| `JWT_SECRET` | Yes | Must match the backend JWT_SECRET |
| `ADMIN_PASSWORD` | No | Password to access the admin panel |

---

## Pricing Tiers

| Tier | Price | Generations | Features |
|---|---|---|---|
| Free Trial | $0 | 3 total | All formats, CSV + JSON export |
| Beginner | $7/mo | 5/month | All formats, CSV + JSON export |
| Pro | $14/mo | Unlimited | Everything + custom prompt templates, free-form mode, priority support |

---

## Project Structure

```
.
├── backend/
│   ├── main.py                   # FastAPI app, CORS, router registration
│   ├── models.py                 # SQLAlchemy ORM models (User, UserPlan, etc.)
│   ├── alembic/                  # Database migrations
│   ├── core/
│   │   ├── config.py             # Environment variable loading
│   │   ├── database.py           # Async DB session
│   │   ├── deps.py               # FastAPI dependencies (auth)
│   │   ├── security.py           # JWT, password hashing
│   │   └── limiter.py            # Rate limiter
│   ├── routers/
│   │   ├── auth.py               # POST /auth/register, /auth/login, /auth/me
│   │   ├── billing.py            # POST /billing/checkout, /billing/portal, /billing/webhook
│   │   ├── generate.py           # POST /generate (full pipeline)
│   │   ├── user.py               # GET /user/plan, PATCH /user/settings
│   │   ├── trial.py              # Trial generation endpoint
│   │   ├── youtube.py            # POST /ingest/youtube
│   │   └── blog.py               # POST /ingest/blog
│   ├── schemas/
│   │   ├── ingest.py             # Pydantic models for ingestion
│   │   └── generate.py           # Pydantic models for generation
│   └── services/
│       ├── chunker.py            # 400–900 word semantic chunking
│       ├── embedder.py           # TF-IDF embedding
│       ├── ranker.py             # Cosine dedup + diversity ranking
│       ├── generator.py          # Groq inference + stub fallback
│       ├── transcript.py         # YouTube transcript (Supadata + fallback)
│       ├── utils.py              # Shared utilities
│       └── exporter.py           # CSV / JSON export
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── auth/                 # Login + signup pages
│   │   ├── dashboard/            # Authenticated app shell
│   │   │   ├── generate/         # Content generation page
│   │   │   ├── history/          # Generation history + pack viewer
│   │   │   ├── insights/         # Usage analytics
│   │   │   ├── settings/         # API keys, provider, custom prompt
│   │   │   ├── billing/          # Plan status + Stripe portal
│   │   │   ├── profile/          # Display name
│   │   │   └── plan/             # Upgrade page
│   │   ├── admin/                # Admin panel (password protected)
│   │   └── api/                  # Next.js API routes (auth, billing, generate)
│   ├── components/
│   │   ├── GenerateForm.tsx       # Multi-input form (URL, text, audio)
│   │   ├── ContentPackView.tsx    # Tabbed content pack + export
│   │   ├── FreeFormView.tsx       # Free-form output display
│   │   ├── WelcomeModal.tsx       # First-time tutorial modal
│   │   ├── Navbar.tsx             # Landing page nav
│   │   ├── HeroSection.tsx        # Landing hero
│   │   ├── FeaturesSection.tsx    # Feature cards
│   │   ├── HowItWorksSection.tsx  # Pipeline steps
│   │   ├── PricingSection.tsx     # Pricing tiers
│   │   └── dashboard/            # Dashboard nav, mobile nav, billing buttons
│   └── lib/
│       ├── api.ts                 # Typed fetch wrappers
│       └── auth.ts                # Auth helpers
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── requirements.txt
└── CLAUDE.md
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Login and receive a JWT cookie |
| `GET` | `/auth/me` | Get current user profile |

### Generation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Full pipeline — URLs, text, or audio → content pack |
| `POST` | `/trial-generate` | Unauthenticated trial (3 uses, IP-limited) |

### Billing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/billing/checkout` | Create a Stripe checkout session |
| `POST` | `/billing/portal` | Open Stripe customer portal |
| `POST` | `/billing/webhook` | Stripe webhook handler |

### Ingestion (dev/debug)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ingest/youtube` | Extract transcript from a YouTube URL |
| `POST` | `/ingest/blog` | Scrape and clean a blog article |

---

## Generation Pipeline

```
Input (URLs / raw text / audio)
 ↓
Ingest (Supadata + youtube-transcript-api / trafilatura / Whisper)
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
Export (CSV + JSON) + persist to DB
```

Per-URL errors are non-fatal — they appear in `errors[]` while successfully processed URLs still contribute to the pack. The API only returns `422` if **all** inputs fail.

---

## Built By

**Enigma-Cube** — © 2026
