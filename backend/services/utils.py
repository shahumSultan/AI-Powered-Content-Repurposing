from urllib.parse import parse_qs, urlparse


def extract_video_id(url: str) -> str | None:
    """Extract a YouTube video ID from a URL. Returns None if not found."""
    parsed = urlparse(url)
    if parsed.hostname in ("youtu.be",):
        vid = parsed.path.lstrip("/")
        return vid or None
    if parsed.hostname in ("www.youtube.com", "youtube.com"):
        qs = parse_qs(parsed.query)
        if "v" in qs:
            return qs["v"][0]
    return None
