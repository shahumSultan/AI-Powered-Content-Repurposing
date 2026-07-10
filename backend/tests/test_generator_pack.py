from services.chunker import Chunk
from services.generator import _pack_from_dict


def _chunk(text: str, start: float | None = None, end: float | None = None) -> Chunk:
    return Chunk(
        text=text,
        word_count=len(text.split()),
        timestamp_start=start,
        timestamp_end=end,
    )


def _full_data() -> dict:
    return {
        "hooks": [{"text": f"hook {i}"} for i in range(6)],           # 6 provided
        "linkedin_posts": [{"text": f"post {i}"} for i in range(3)],  # 3 provided
        "ig_captions": [{"text": f"caption {i}"} for i in range(6)],
        "shorts_ideas": [
            {"title": f"short {i}", "what_to_say": f"say {i}"} for i in range(4)
        ],
        "x_threads": [
            {"tweets": ["t1", "t2", "t3", "t4", "t5", "t6", 42]},
            {"tweets": ["extra thread"]},
        ],
    }


def test_list_limits_enforced():
    pack = _pack_from_dict(_full_data(), chunks=[])
    assert len(pack.hooks) == 5
    assert len(pack.linkedin_posts) == 2
    assert len(pack.ig_captions) == 5
    assert len(pack.shorts_ideas) == 3
    assert len(pack.x_threads) == 1


def test_x_thread_tweets_capped_and_non_strings_dropped():
    pack = _pack_from_dict(_full_data(), chunks=[])
    assert pack.x_threads[0].tweets == ["t1", "t2", "t3", "t4", "t5"]


def test_shorts_get_timestamps_from_timestamped_chunks():
    chunks = [
        _chunk("first topic", start=10.0, end=40.0),
        _chunk("no timestamps here"),
        _chunk("second topic", start=120.0, end=180.0),
    ]
    pack = _pack_from_dict(_full_data(), chunks=chunks)
    assert pack.shorts_ideas[0].timestamp_start == 10.0
    assert pack.shorts_ideas[1].timestamp_start == 120.0
    # Only 2 timestamped chunks available for 3 shorts — the third gets None
    assert pack.shorts_ideas[2].timestamp_start is None


def test_shorts_clip_window_capped_at_60_seconds():
    # Chunk spans 26+ minutes — the displayed clip must still be 60s
    chunks = [_chunk("long chunk", start=55.0, end=1631.0)]
    pack = _pack_from_dict(_full_data(), chunks=chunks)
    assert pack.shorts_ideas[0].timestamp_start == 55.0
    assert pack.shorts_ideas[0].timestamp_end == 115.0


def test_shorts_overlapping_starts_deduplicated():
    # Two chunks starting within 60s of each other — only the first is used
    chunks = [
        _chunk("chunk a", start=55.0, end=1631.0),
        _chunk("chunk b", start=55.0, end=1196.0),   # same start as a
        _chunk("chunk c", start=80.0, end=900.0),    # within 60s of a
        _chunk("chunk d", start=300.0, end=1442.0),  # far enough away
    ]
    pack = _pack_from_dict(_full_data(), chunks=chunks)
    starts = [s.timestamp_start for s in pack.shorts_ideas]
    assert starts == [55.0, 300.0, None]


def test_shorts_word_count_computed():
    data = _full_data()
    data["shorts_ideas"][0]["what_to_say"] = "one two three four five"
    pack = _pack_from_dict(data, chunks=[])
    assert pack.shorts_ideas[0].word_count == 5


def test_missing_keys_produce_empty_pack():
    pack = _pack_from_dict({}, chunks=[])
    assert pack.hooks == []
    assert pack.linkedin_posts == []
    assert pack.ig_captions == []
    assert pack.shorts_ideas == []
    assert pack.x_threads == []
