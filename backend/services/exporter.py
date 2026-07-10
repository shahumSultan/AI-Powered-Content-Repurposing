from __future__ import annotations
import csv
import io
from schemas.generate import ContentPack


def to_csv(pack: ContentPack) -> str:
    """Serialise *pack* to an RFC 4180 CSV string."""
    buf = io.StringIO()
    writer = csv.writer(buf, quoting=csv.QUOTE_ALL)

    writer.writerow(["type", "index", "text", "timestamp_start", "timestamp_end"])

    for i, item in enumerate(pack.hooks, start=1):
        writer.writerow(["hook", i, item.text, "", ""])

    for i, item in enumerate(pack.linkedin_posts, start=1):
        writer.writerow(["linkedin_post", i, item.text, "", ""])

    for i, item in enumerate(pack.ig_captions, start=1):
        writer.writerow(["ig_caption", i, item.text, "", ""])

    for i, item in enumerate(pack.shorts_ideas, start=1):
        writer.writerow([
            "shorts_idea",
            i,
            f"{item.title} | {item.what_to_say}",
            item.timestamp_start if item.timestamp_start is not None else "",
            item.timestamp_end if item.timestamp_end is not None else "",
        ])

    if pack.meta_caption is not None:
        writer.writerow(["meta_primary_text", 1, pack.meta_caption.primary_text, "", ""])
        writer.writerow(["meta_headline", 1, pack.meta_caption.headline, "", ""])
        writer.writerow(["meta_description", 1, pack.meta_caption.description, "", ""])

    return buf.getvalue()
