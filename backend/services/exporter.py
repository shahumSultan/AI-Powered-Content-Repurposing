from __future__ import annotations

import csv
import io

from backend.schemas.generate import ContentPack


def to_csv(pack: ContentPack) -> str:
    """Serialise *pack* to an RFC 4180 CSV string with 40 data rows."""
    buf = io.StringIO()
    writer = csv.writer(buf, quoting=csv.QUOTE_ALL)

    writer.writerow(["type", "index", "text", "timestamp_start", "timestamp_end"])

    for i, item in enumerate(pack.hooks, start=1):
        writer.writerow(["hook", i, item.text, "", ""])

    for i, item in enumerate(pack.linkedin_posts, start=1):
        writer.writerow(["linkedin_post", i, item.text, "", ""])

    for i, item in enumerate(pack.twitter_posts, start=1):
        writer.writerow(["twitter_post", i, item.text, "", ""])

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

    return buf.getvalue()
