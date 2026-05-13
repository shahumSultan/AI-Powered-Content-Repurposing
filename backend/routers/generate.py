from __future__ import annotations
import json
from urllib.parse import urlparse
import httpx
import trafilatura
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled
from schemas.generate import GenerateRequest, GenerateResponse, GenerateTextRequest
from schemas.ingest import TranscriptSegment
from services.chunker import Chunk, chunk_text
from services.exporter import to_csv
from services.generator import NoApiKeyError, generate_content_pack
from services.ranker import rank
from services.transcript import fetch_transcript
from services.transcriber import transcribe
from core.ssrf import assert_safe_url

router = APIRouter(prefix="/generate", tags=["generate"])

_MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB


def _is_youtube(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return host in ("youtu.be", "youtube.com", "www.youtube.com")


def _extract_video_id(url: str) -> str:
    from services.utils import extract_video_id
    vid = extract_video_id(url)
    if vid is None:
        raise ValueError(f"Cannot extract video ID from: {url}")
    return vid


def _ingest_youtube(url: str) -> tuple[str, list[TranscriptSegment]]:
    assert_safe_url(url)
    video_id = _extract_video_id(url)
    try:
        segments = fetch_transcript(video_id)
    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise ValueError("No transcript found for this video")
    except Exception as e:
        raise ValueError(f"Failed to fetch transcript: {e}")

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


def _build_response(
    chunks: list[Chunk],
    errors: list[str],
    groq_key: str | None,
    openai_key: str | None,
    custom_prompt: str | None = None,
) -> GenerateResponse:
    ranked = rank(chunks)
    try:
        pack = generate_content_pack(ranked, custom_prompt=custom_prompt, groq_api_key=groq_key, openai_api_key=openai_key)
    except NoApiKeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
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
    x_custom_prompt: str | None = Header(None),
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

    return _build_response(all_chunks, errors, x_groq_api_key, x_openai_api_key, x_custom_prompt)


@router.post("/text", response_model=GenerateResponse)
def generate_from_text(
    body: GenerateTextRequest,
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
    x_custom_prompt: str | None = Header(None),
) -> GenerateResponse:
    chunks = _ingest_text(body.text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No content could be extracted from the provided text")
    return _build_response(chunks, [], x_groq_api_key, x_openai_api_key, x_custom_prompt)


@router.post("/audio", response_model=GenerateResponse)
async def generate_from_audio(
    file: UploadFile = File(...),
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
    x_custom_prompt: str | None = Header(None),
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

    return _build_response(chunks, [], x_groq_api_key, x_openai_api_key, x_custom_prompt)
