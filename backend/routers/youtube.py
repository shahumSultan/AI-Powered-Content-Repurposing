from fastapi import APIRouter, HTTPException
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled, YouTubeTranscriptApi
from backend.schemas.ingest import IngestRequest, TranscriptSegment, YouTubeIngestResponse
from backend.services.utils import extract_video_id

ytt_api = YouTubeTranscriptApi()

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
        raw = ytt_api.fetch(video_id)
    except TranscriptsDisabled:
        raise HTTPException(status_code=422, detail="Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript found for this video")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch transcript: {e}")
    

    transcript = [
        TranscriptSegment(text=seg.text, start=seg.start, duration=seg.duration)
        for seg in raw
    ]
    return YouTubeIngestResponse(url=url, video_id=video_id, transcript=transcript)
