from schemas.ingest import TranscriptSegment
from services.chunker import chunk_text


def _sentence(word: str, n: int) -> str:
    return " ".join([word] * n) + "."


def test_empty_text_returns_no_chunks():
    assert chunk_text("") == []
    assert chunk_text("   \n  ") == []


def test_short_text_single_chunk():
    text = "This is a short sentence. Another short one here."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0].word_count == 9
    assert "short sentence" in chunks[0].text


def test_long_text_chunks_within_word_limits():
    # 20 sentences of 50 words each = 1000 words total
    text = " ".join(_sentence("word", 50) for _ in range(20))
    chunks = chunk_text(text)
    assert len(chunks) >= 2
    # Every chunk except possibly the last must be within 400–900 words
    for chunk in chunks[:-1]:
        assert 400 <= chunk.word_count <= 900
    assert chunks[-1].word_count <= 900


def test_oversized_sentence_emitted_alone():
    huge = _sentence("big", 950)
    small = _sentence("small", 10)
    chunks = chunk_text(f"{small} {huge} {small}")
    word_counts = [c.word_count for c in chunks]
    assert 950 in word_counts


def test_no_segments_means_no_timestamps():
    chunks = chunk_text("A sentence here. Another sentence there.")
    assert chunks[0].timestamp_start is None
    assert chunks[0].timestamp_end is None


def test_timestamps_resolved_from_segments():
    segments = [
        TranscriptSegment(text="hello world", start=5.0, duration=2.0),
        TranscriptSegment(text="goodbye world", start=10.0, duration=3.0),
    ]
    chunks = chunk_text("hello world. goodbye world.", segments=segments)
    assert len(chunks) == 1
    assert chunks[0].timestamp_start == 5.0
    assert chunks[0].timestamp_end == 13.0  # 10.0 start + 3.0 duration
