from __future__ import annotations
import json
from urllib.parse import urlparse
import httpx
import trafilatura
import yt_dlp
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from schemas.generate import GenerateRequest, GenerateResponse, GenerateTextRequest
from schemas.ingest import TranscriptSegment
from services.chunker import Chunk, chunk_text
from services.exporter import to_csv
from services.generator import generate_content_pack
from services.ranker import rank
from services.transcriber import transcribe
from core.ssrf import assert_safe_url

router = APIRouter(prefix="/generate", tags=["generate"])

_MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB


def _is_youtube(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return host in ("youtu.be", "youtube.com", "www.youtube.com")


def _ingest_youtube(url: str) -> tuple[str, list[TranscriptSegment]]:
    assert_safe_url(url)

    ydl_opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise ValueError(f"Failed to fetch video info: {e}")

    captions: dict = info.get("automatic_captions") or {}
    subtitles: dict = info.get("subtitles") or {}

    en_formats = (
        subtitles.get("en")
        or subtitles.get("en-US")
        or captions.get("en")
        or captions.get("en-US")
        or captions.get("en-orig")
    )

    if not en_formats:
        raise ValueError("No English captions found for this video")

    json3_entry = next(
        (f for f in en_formats if f.get("ext") == "json3"),
        None,
    )
    if not json3_entry:
        raise ValueError("No parseable caption format found")

    try:
        r = httpx.get(json3_entry["url"], timeout=30, follow_redirects=True)
        r.raise_for_status()
        caption_data = r.json()
    except Exception as e:
        raise ValueError(f"Failed to fetch captions: {e}")

    segments: list[TranscriptSegment] = []
    for event in caption_data.get("events", []):
        if "segs" not in event:
            continue
        t_start_ms: float = event.get("tStartMs", 0)
        d_duration_ms: float = event.get("dDurationMs", 0)
        text = "".join(seg.get("utf8", "") for seg in event["segs"]).strip()
        if not text or text == "\n":
            continue
        segments.append(TranscriptSegment(
            text=text,
            start=t_start_ms / 1000.0,
            duration=d_duration_ms / 1000.0,
        ))

    if not segments:
        raise ValueError("Caption file was empty")

    full_text = " ".join(seg.text for seg in segments)
    return full_text, segments


def _ingest_blog(url: str) -> str:
    assert_safe_url(url)
    downloaded = trafilatura.fetch_url(url)
    if downloaded is None:
        raise ValueError("Failed to fetch URL")
    text = trafilatura.extract(downloaded, include_tables=False, output_format="txt")
    if text is None:
        raise ValueError("Could not extract article text from URL")
    return text


def _ingest_text(text: str) -> list[Chunk]:
    return chunk_text(text)


def _build_response(chunks: list[Chunk], errors: list[str], groq_key: str | None, openai_key: str | None) -> GenerateResponse:
    ranked = rank(chunks)
    pack = generate_content_pack(ranked, groq_api_key=groq_key, openai_api_key=openai_key)
    csv_str = to_csv(pack)
    return GenerateResponse(
        content_pack=pack,
        errors=errors,
        export_json=json.loads(pack.model_dump_json()),
        export_csv=csv_str,
    )


@router.post("", response_model=GenerateResponse)
def generate(
    body: GenerateRequest,
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
) -> GenerateResponse:
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

    return _build_response(all_chunks, errors, x_groq_api_key, x_openai_api_key)


@router.post("/text", response_model=GenerateResponse)
def generate_from_text(
    body: GenerateTextRequest,
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
) -> GenerateResponse:
    chunks = _ingest_text(body.text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No content could be extracted from the provided text")
    return _build_response(chunks, [], x_groq_api_key, x_openai_api_key)


@router.post("/audio", response_model=GenerateResponse)
async def generate_from_audio(
    file: UploadFile = File(...),
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
) -> GenerateResponse:
    audio_bytes = await file.read(_MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 25 MB limit")

    try:
        text, segments = transcribe(audio_bytes, openai_api_key=x_openai_api_key)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Transcription failed: {e}")

    chunks = chunk_text(text, segments)
    if not chunks:
        raise HTTPException(status_code=422, detail="No content could be transcribed from the audio")

    return _build_response(chunks, [], x_groq_api_key, x_openai_api_key)
