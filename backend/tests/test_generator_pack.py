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


def test_missing_keys_produce_empty_pack():
    pack = _pack_from_dict({}, chunks=[])
    assert pack.hooks == []
    assert pack.linkedin_posts == []
    assert pack.ig_captions == []
    assert pack.shorts_ideas == []
    assert pack.x_threads == []
