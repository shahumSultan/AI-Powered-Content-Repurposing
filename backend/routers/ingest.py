from urllib.parse import parse_qs, urlparse

import trafilatura
from fastapi import APIRouter, HTTPException
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled, YouTubeTranscriptApi

from backend.schemas.ingest import (
    BlogIngestResponse,
    IngestRequest,
    TranscriptSegment,
    YouTubeIngestResponse,
)

router = APIRouter(prefix="/ingest", tags=["ingest"])


def _extract_video_id(url: str) -> str:
    parsed = urlparse(url)
    if parsed.hostname in ("youtu.be",):
        return parsed.path.lstrip("/")
    if parsed.hostname in ("www.youtube.com", "youtube.com"):
        qs = parse_qs(parsed.query)
        if "v" in qs:
            return qs["v"][0]
    raise HTTPException(status_code=422, detail="Could not extract video ID from URL")


@router.post("/youtube", response_model=YouTubeIngestResponse)
def ingest_youtube(body: IngestRequest) -> YouTubeIngestResponse:
    url = str(body.url)
    video_id = _extract_video_id(url)

    try:
        raw = YouTubeTranscriptApi.get_transcript(video_id)
    except TranscriptsDisabled:
        raise HTTPException(status_code=422, detail="Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript found for this video")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch transcript: {e}")

    transcript = [
        TranscriptSegment(text=seg["text"], start=seg["start"], duration=seg["duration"])
        for seg in raw
    ]
    return YouTubeIngestResponse(url=url, video_id=video_id, transcript=transcript)


@router.post("/blog", response_model=BlogIngestResponse)
def ingest_blog(body: IngestRequest) -> BlogIngestResponse:
    url = str(body.url)

    downloaded = trafilatura.fetch_url(url)
    if downloaded is None:
        raise HTTPException(status_code=502, detail="Failed to fetch URL")

    result = trafilatura.extract(downloaded, include_tables=False, output_format="txt")
    if result is None:
        raise HTTPException(status_code=422, detail="Could not extract article text from URL")

    metadata = trafilatura.extract(downloaded, output_format="json", with_metadata=True)
    title: str | None = None
    if metadata:
        import json
        parsed = json.loads(metadata)
        title = parsed.get("title")

    return BlogIngestResponse(url=url, title=title, text=result)
