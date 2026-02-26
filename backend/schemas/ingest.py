from pydantic import BaseModel, HttpUrl


class IngestRequest(BaseModel):
    url: HttpUrl


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class YouTubeIngestResponse(BaseModel):
    url: str
    video_id: str
    transcript: list[TranscriptSegment]


class BlogIngestResponse(BaseModel):
    url: str
    title: str | None
    text: str
