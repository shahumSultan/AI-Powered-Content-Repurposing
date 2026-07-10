"""Tests for the free-form source builder (verbatim clip extraction path)."""
from services.chunker import Chunk
from services.generator import (
    _FREE_FORM_MAX_PROMPT_WORDS,
    _build_free_form_source,
    _format_ts,
)


def _chunk(text: str, start: float | None = None, end: float | None = None) -> Chunk:
    return Chunk(
        text=text,
        word_count=len(text.split()),
        timestamp_start=start,
        timestamp_end=end,
    )


def test_format_ts_minutes_and_hours():
    assert _format_ts(0) == "0:00"
    assert _format_ts(65) == "1:05"
    assert _format_ts(725.9) == "12:05"
    assert _format_ts(3725) == "1:02:05"


def test_source_preserves_original_order():
    chunks = [
        _chunk("intro about the guest", 0.0),
        _chunk("middle story about growth", 600.0),
        _chunk("closing thoughts and cta", 1200.0),
    ]
    source = _build_free_form_source(chunks)
    assert source.index("intro about the guest") < source.index("middle story about growth")
    assert source.index("middle story about growth") < source.index("closing thoughts and cta")


def test_source_includes_all_chunks_not_just_top_three():
    chunks = [_chunk(f"chunk number {i} content", float(i * 100)) for i in range(10)]
    source = _build_free_form_source(chunks)
    for i in range(10):
        assert f"chunk number {i} content" in source


def test_timestamp_range_prefixed_for_transcript_chunks():
    source = _build_free_form_source([_chunk("he said something great", 725.0, 810.0)])
    assert source.startswith("[12:05 - 13:30] he said something great")


def test_start_only_timestamp_when_end_missing():
    source = _build_free_form_source([_chunk("he said something great", 725.0)])
    assert source.startswith("[12:05] he said something great")


def test_no_timestamp_prefix_for_blog_chunks():
    source = _build_free_form_source([_chunk("plain article text")])
    assert source == "plain article text"
    assert "[" not in source


def test_source_capped_at_word_budget():
    long_text = " ".join(f"word{i}" for i in range(3000))
    chunks = [_chunk(long_text, float(i)) for i in range(4)]  # ~12k words total
    source = _build_free_form_source(chunks)
    assert len(source.split()) == _FREE_FORM_MAX_PROMPT_WORDS
