import http.cookiejar
import json
import os
import urllib.request

import requests
import yt_dlp
from fastapi import APIRouter, HTTPException
from schemas.ingest import IngestRequest, TranscriptSegment, YouTubeIngestResponse
from services.utils import extract_video_id
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled, YouTubeTranscriptApi

router = APIRouter(prefix="/ingest", tags=["ingest"])


def _make_api() -> YouTubeTranscriptApi:
    cookies_file = os.getenv("YOUTUBE_COOKIES_FILE")
    if cookies_file and os.path.isfile(cookies_file):
        jar = http.cookiejar.MozillaCookieJar(cookies_file)
        jar.load(ignore_discard=True, ignore_expires=True)
        session = requests.Session()
        session.cookies = jar  # type: ignore[assignment]
        return YouTubeTranscriptApi(http_client=session)
    return YouTubeTranscriptApi()


def _fetch_via_ytdlp(video_id: str) -> list[TranscriptSegment]:
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    auto_caps = info.get("automatic_captions", {})
    manual_subs = info.get("subtitles", {})

    cap_list = manual_subs.get("en") or auto_caps.get("en") or []
    json3_entry = next((c for c in cap_list if c.get("ext") == "json3"), None)
    if not json3_entry:
        # Try any available language
        for lang_caps in list(manual_subs.values()) + list(auto_caps.values()):
            json3_entry = next((c for c in lang_caps if c.get("ext") == "json3"), None)
            if json3_entry:
                break

    if not json3_entry:
        raise ValueError("No captions found via yt-dlp")

    with urllib.request.urlopen(json3_entry["url"], timeout=30) as resp:
        data = json.loads(resp.read())

    segments: list[TranscriptSegment] = []
    for event in data.get("events", []):
        if "segs" not in event:
            continue
        text = "".join(s.get("utf8", "") for s in event["segs"]).strip()
        if not text or text == "\n":
            continue
        start = event.get("tStartMs", 0) / 1000.0
        duration = event.get("dDurationMs", 0) / 1000.0
        segments.append(TranscriptSegment(text=text, start=start, duration=duration))

    if not segments:
        raise ValueError("yt-dlp returned empty transcript")
    return segments


def _extract_video_id(url: str) -> str:
    vid = extract_video_id(url)
    if vid is None:
        raise HTTPException(status_code=422, detail="Could not extract video ID from URL")
    return vid


@router.post("/youtube", response_model=YouTubeIngestResponse)
def ingest_youtube(body: IngestRequest) -> YouTubeIngestResponse:
    url = str(body.url)
    video_id = _extract_video_id(url)

    # Primary: youtube-transcript-api (with optional browser cookies)
    try:
        raw = _make_api().fetch(video_id)
        transcript = [
            TranscriptSegment(text=seg.text, start=seg.start, duration=seg.duration)
            for seg in raw
        ]
        return YouTubeIngestResponse(url=url, video_id=video_id, transcript=transcript)
    except TranscriptsDisabled:
        raise HTTPException(status_code=422, detail="Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript found for this video")
    except Exception:
        pass  # fall through to yt-dlp

    # Fallback: yt-dlp
    try:
        transcript = _fetch_via_ytdlp(video_id)
        return YouTubeIngestResponse(url=url, video_id=video_id, transcript=transcript)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Could not fetch transcript: {e}. "
                "Tip: export browser cookies to a Netscape-format file and set "
                "YOUTUBE_COOKIES_FILE=/path/to/cookies.txt in your .env"
            ),
        )
