from __future__ import annotations

import re
from dataclasses import dataclass, field

from backend.schemas.ingest import TranscriptSegment

_MIN_WORDS = 400
_MAX_WORDS = 900


@dataclass
class Chunk:
    text: str
    word_count: int
    timestamp_start: float | None = field(default=None)
    timestamp_end: float | None = field(default=None)


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences on '. ', '! ', '? ', or newlines."""
    parts = re.split(r"(?<=[.!?])\s+|\n+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def chunk_text(
    text: str,
    segments: list[TranscriptSegment] | None = None,
) -> list[Chunk]:
    """
    Split *text* into chunks of _MIN_WORDS–_MAX_WORDS words.

    When *segments* is provided (YouTube transcripts), each chunk is annotated
    with the timestamp range covered by its sentences.
    """
    sentences = _split_sentences(text)
    chunks: list[Chunk] = []

    current_sentences: list[str] = []
    current_words = 0

    def _flush() -> None:
        if not current_sentences:
            return
        chunk_text_str = " ".join(current_sentences)
        ts_start, ts_end = _resolve_timestamps(chunk_text_str, segments)
        chunks.append(
            Chunk(
                text=chunk_text_str,
                word_count=current_words,
                timestamp_start=ts_start,
                timestamp_end=ts_end,
            )
        )

    for sentence in sentences:
        words = len(sentence.split())

        # If a single sentence already exceeds the max, flush what we have and
        # emit it as its own chunk.
        if words >= _MAX_WORDS:
            _flush()
            current_sentences.clear()
            current_words = 0
            ts_start, ts_end = _resolve_timestamps(sentence, segments)
            chunks.append(
                Chunk(
                    text=sentence,
                    word_count=words,
                    timestamp_start=ts_start,
                    timestamp_end=ts_end,
                )
            )
            continue

        # Adding this sentence would exceed the max — flush first.
        if current_words + words > _MAX_WORDS:
            _flush()
            current_sentences.clear()
            current_words = 0

        current_sentences.append(sentence)
        current_words += words

        # Reached the sweet-spot minimum — flush.
        if current_words >= _MIN_WORDS:
            _flush()
            current_sentences.clear()
            current_words = 0

    # Flush any remaining sentences as a final (possibly short) chunk.
    _flush()

    return chunks


def _resolve_timestamps(
    chunk_text: str,
    segments: list[TranscriptSegment] | None,
) -> tuple[float | None, float | None]:
    """Return (start, end) timestamps for the segment range that overlaps chunk_text."""
    if not segments:
        return None, None

    matching = [
        seg for seg in segments if seg.text and seg.text.strip() in chunk_text
    ]
    if not matching:
        return None, None

    ts_start = min(seg.start for seg in matching)
    last = max(matching, key=lambda s: s.start)
    ts_end = last.start + last.duration
    return ts_start, ts_end
