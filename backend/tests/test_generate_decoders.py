import base64
import json

from routers.generate import _decode_brand_kit, _decode_prompt, _is_youtube


def _b64(s: str) -> str:
    return base64.b64encode(s.encode("utf-8")).decode("ascii")


# ── _decode_prompt ────────────────────────────────────────────────────────────

def test_decode_prompt_none():
    assert _decode_prompt(None) is None
    assert _decode_prompt("") is None


def test_decode_prompt_valid_base64():
    assert _decode_prompt(_b64("Extract 3 clips verbatim")) == "Extract 3 clips verbatim"


def test_decode_prompt_invalid_base64_falls_back_to_raw():
    raw = "!!!invalid!!!"
    assert _decode_prompt(raw) == raw


# ── _decode_brand_kit ─────────────────────────────────────────────────────────

def test_decode_brand_kit_none():
    assert _decode_brand_kit(None) is None
    assert _decode_brand_kit("") is None


def test_decode_brand_kit_invalid_base64_returns_none():
    assert _decode_brand_kit("not base64 at all!!!") is None


def test_decode_brand_kit_full_kit():
    kit = {
        "brand_name": "ContentCube",
        "brand_voice": "friendly, direct",
        "target_audience": "solo creators",
        "niche": "content marketing",
        "preferred_cta": "Try it free",
        "default_hashtags": "#content #ai",
    }
    result = _decode_brand_kit(_b64(json.dumps(kit)))
    assert result is not None
    assert result.startswith("BRAND CONTEXT:")
    assert "Brand: ContentCube" in result
    assert "Voice: friendly, direct" in result
    assert "Hashtags: #content #ai" in result


def test_decode_brand_kit_skips_empty_fields():
    kit = {"brand_name": "ContentCube", "brand_voice": "   ", "niche": None}
    result = _decode_brand_kit(_b64(json.dumps(kit)))
    assert result == "BRAND CONTEXT:\nBrand: ContentCube"


def test_decode_brand_kit_all_empty_returns_none():
    kit = {"brand_name": "", "brand_voice": "  "}
    assert _decode_brand_kit(_b64(json.dumps(kit))) is None


# ── _is_youtube ───────────────────────────────────────────────────────────────

def test_is_youtube_hosts():
    assert _is_youtube("https://www.youtube.com/watch?v=abc123") is True
    assert _is_youtube("https://youtu.be/abc123") is True
    assert _is_youtube("https://youtube.com/watch?v=abc123") is True
    assert _is_youtube("https://example.com/watch?v=abc123") is False
    assert _is_youtube("https://notyoutube.com/") is False
