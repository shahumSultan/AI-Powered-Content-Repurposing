from fastapi import APIRouter, HTTPException
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled

from schemas.ingest import IngestRequest, YouTubeIngestResponse
from services.transcript import fetch_transcript
from services.utils import extract_video_id

router = APIRouter(prefix="/ingest", tags=["ingest"])


def _extract_video_id(url: str) -> str:
    vid = extract_video_id(url)
    if vid is None:
        raise HTTPException(status_code=422, detail="Could not extract video ID from URL")
    return vid


@router.post("/youtube", response_model=YouTubeIngestResponse)
def ingest_youtube(body: IngestRequest) -> YouTubeIngestResponse:
    url = str(body.url)
    video_id = _extract_video_id(url)

    try:
        transcript = fetch_transcript(video_id)
        return YouTubeIngestResponse(url=url, video_id=video_id, transcript=transcript)
    except TranscriptsDisabled:
        raise HTTPException(status_code=422, detail="Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript found for this video")
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Could not fetch transcript ({e}). "
                "Set SUPADATA_API_KEY in Railway env vars for a permanent fix (supadata.ai)."
            ),
        )
