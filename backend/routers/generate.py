from __future__ import annotations
import base64
import json
import logging
from typing import Literal
from urllib.parse import urlparse
import httpx
import trafilatura
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled
from schemas.generate import GenerateRequest, GenerateResponse, GenerateTextRequest
from schemas.ingest import TranscriptSegment
from services.chunker import Chunk, chunk_text
from services.exporter import to_csv
from services.generator import NoApiKeyError, generate_content_pack, generate_free_form, generate_single_item
from services.ranker import rank
from services.transcript import fetch_transcript
from services.transcriber import transcribe
from core.ssrf import assert_safe_url
from core.deps import get_current_user
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["generate"])

_MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB


def _decode_prompt(raw: str | None) -> str | None:
    """Decode a base64-encoded custom prompt header sent by the frontend."""
    if not raw:
        return None
    try:
        return base64.b64decode(raw).decode("utf-8")
    except Exception:
        return raw  # fall back to raw value for any non-base64 clients


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


def _empty_pack():
    from schemas.generate import ContentPack
    return ContentPack(hooks=[], linkedin_posts=[], ig_captions=[], shorts_ideas=[])


def _build_response(
    chunks: list[Chunk],
    errors: list[str],
    groq_key: str | None,
    openai_key: str | None,
    custom_prompt: str | None = None,
    free_form: bool = False,
) -> GenerateResponse:
    ranked = rank(chunks)
    try:
        if free_form and custom_prompt:
            raw = generate_free_form(ranked, custom_prompt=custom_prompt, groq_api_key=groq_key, openai_api_key=openai_key)
            pack = _empty_pack()
            return GenerateResponse(
                content_pack=pack,
                errors=errors,
                export_json={},
                export_csv="",
                raw_output=raw,
            )
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
    x_free_form: str | None = Header(None),
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

    return _build_response(all_chunks, errors, x_groq_api_key, x_openai_api_key, _decode_prompt(x_custom_prompt), free_form=x_free_form == "true")


@router.post("/text", response_model=GenerateResponse)
def generate_from_text(
    body: GenerateTextRequest,
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
    x_custom_prompt: str | None = Header(None),
    x_free_form: str | None = Header(None),
) -> GenerateResponse:
    chunks = _ingest_text(body.text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No content could be extracted from the provided text")
    return _build_response(chunks, [], x_groq_api_key, x_openai_api_key, _decode_prompt(x_custom_prompt), free_form=x_free_form == "true")


@router.post("/audio", response_model=GenerateResponse)
async def generate_from_audio(
    file: UploadFile = File(...),
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
    x_custom_prompt: str | None = Header(None),
    x_free_form: str | None = Header(None),
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

    return _build_response(chunks, [], x_groq_api_key, x_openai_api_key, _decode_prompt(x_custom_prompt), free_form=x_free_form == "true")


# ---------------------------------------------------------------------------
# Single-item regeneration (no quota consumed)
# ---------------------------------------------------------------------------

class SingleItemRequest(BaseModel):
    item_type: Literal["hook", "linkedin", "ig_caption", "shorts_idea"]
    context: str


@router.post("/item")
def regenerate_item(
    body: SingleItemRequest,
    x_groq_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
    current_user: User = Depends(get_current_user),
) -> dict:
    try:
        item = generate_single_item(
            body.item_type,
            body.context,
            groq_api_key=x_groq_api_key,
            openai_api_key=x_openai_api_key,
        )
        return {"item": item}
    except NoApiKeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.warning("Single item regeneration failed: %s", exc)
        raise HTTPException(status_code=500, detail="Regeneration failed")
