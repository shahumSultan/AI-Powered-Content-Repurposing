from __future__ import annotations
import json
from urllib.parse import parse_qs, urlparse
import trafilatura
from fastapi import APIRouter, HTTPException
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled, YouTubeTranscriptApi
from backend.schemas.generate import GenerateRequest, GenerateResponse
from backend.schemas.ingest import TranscriptSegment
from backend.services.chunker import Chunk, chunk_text
from backend.services.exporter import to_csv
from backend.services.generator import generate_content_pack
from backend.services.ranker import rank

router = APIRouter(prefix="/generate", tags=["generate"])

_ytt_api = YouTubeTranscriptApi()


# ---------------------------------------------------------------------------
# Internal ingestion helpers (no HTTP round-trip)
# ---------------------------------------------------------------------------

def _is_youtube(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return host in ("youtu.be", "youtube.com", "www.youtube.com")


def _extract_video_id(url: str) -> str:
    parsed = urlparse(url)
    if parsed.hostname == "youtu.be":
        return parsed.path.lstrip("/")
    qs = parse_qs(parsed.query)
    if "v" in qs:
        return qs["v"][0]
    raise ValueError(f"Cannot extract video ID from: {url}")


def _ingest_youtube(url: str) -> tuple[str, list[TranscriptSegment]]:
    """Return (full_text, segments). Raises ValueError on failure."""
    video_id = _extract_video_id(url)
    try:
        raw = _ytt_api.fetch(video_id)
    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise ValueError("No transcript found for this video")
    except Exception as e:
        raise ValueError(f"Failed to fetch transcript: {e}")

    segments = [
        TranscriptSegment(text=seg.text, start=seg.start, duration=seg.duration)
        for seg in raw
    ]
    full_text = " ".join(seg.text for seg in segments)
    return full_text, segments


def _ingest_blog(url: str) -> str:
    """Return cleaned article text. Raises ValueError on failure."""
    downloaded = trafilatura.fetch_url(url)
    if downloaded is None:
        raise ValueError("Failed to fetch URL")
    text = trafilatura.extract(downloaded, include_tables=False, output_format="txt")
    if text is None:
        raise ValueError("Could not extract article text from URL")
    return text


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=GenerateResponse)
def generate(body: GenerateRequest) -> GenerateResponse:
    all_chunks: list[Chunk] = []
    errors: list[str] = []

    for raw_url in body.urls:
        url = str(raw_url)
        try:
            if _is_youtube(url):
                text, segments = _ingest_youtube(url)
                chunks = chunk_text(text, segments)
            else:
                text = _ingest_blog(url)
                chunks = chunk_text(text)
            all_chunks.extend(chunks)
        except ValueError as exc:
            errors.append(f"{url}: {exc}")

    if not all_chunks:
        raise HTTPException(
            status_code=422,
            detail="No content could be extracted from the provided URLs. "
                   + " | ".join(errors),
        )

    ranked = rank(all_chunks)
    pack = generate_content_pack(ranked)
    csv_str = to_csv(pack)

    return GenerateResponse(
        content_pack=pack,
        errors=errors,
        export_json=json.loads(pack.model_dump_json()),
        export_csv=csv_str,
    )
