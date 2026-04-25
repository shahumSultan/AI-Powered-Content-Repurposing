import httpx
import yt_dlp
from fastapi import APIRouter, HTTPException
from schemas.ingest import IngestRequest, TranscriptSegment, YouTubeIngestResponse
from services.utils import extract_video_id
from core.ssrf import assert_safe_url

router = APIRouter(prefix="/ingest", tags=["ingest"])


def _fetch_transcript(url: str) -> tuple[str, list[TranscriptSegment]]:
    assert_safe_url(url)

    ydl_opts = {"skip_download": True, "quiet": True, "no_warnings": True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch video info: {e}")

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
        raise HTTPException(status_code=422, detail="No English captions found for this video")

    json3_entry = next((f for f in en_formats if f.get("ext") == "json3"), None)
    if not json3_entry:
        raise HTTPException(status_code=422, detail="No parseable caption format found")

    try:
        r = httpx.get(json3_entry["url"], timeout=30, follow_redirects=True)
        r.raise_for_status()
        caption_data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch captions: {e}")

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
        raise HTTPException(status_code=422, detail="Caption file was empty")

    full_text = " ".join(seg.text for seg in segments)
    return full_text, segments


@router.post("/youtube", response_model=YouTubeIngestResponse)
def ingest_youtube(body: IngestRequest) -> YouTubeIngestResponse:
    url = str(body.url)
    video_id = extract_video_id(url)
    if video_id is None:
        raise HTTPException(status_code=422, detail="Could not extract video ID from URL")

    _, transcript = _fetch_transcript(url)
    return YouTubeIngestResponse(url=url, video_id=video_id, transcript=transcript)
