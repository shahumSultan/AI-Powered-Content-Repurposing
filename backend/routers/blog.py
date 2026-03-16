import json
import trafilatura
from fastapi import APIRouter, HTTPException
from backend.schemas.ingest import BlogIngestResponse, IngestRequest

router = APIRouter(prefix="/ingest", tags=["ingest"])


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
        title = json.loads(metadata).get("title")

    return BlogIngestResponse(url=url, title=title, text=result)
