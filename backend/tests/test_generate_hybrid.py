"""Tests for _build_response — free-form runs must also return a standard pack."""
import pytest

from schemas.generate import ContentPack, Hook, IGCaption, LinkedInPost
from services.chunker import Chunk
import routers.generate as gen


def _chunk(text: str) -> Chunk:
    return Chunk(text=text, word_count=len(text.split()), timestamp_start=None, timestamp_end=None)


def _pack() -> ContentPack:
    return ContentPack(
        hooks=[Hook(text="a hook")],
        linkedin_posts=[LinkedInPost(text="a post")],
        ig_captions=[IGCaption(text="a caption")],
        shorts_ideas=[],
    )


@pytest.fixture
def spy(monkeypatch):
    """Stub both generators and record the kwargs each was called with."""
    calls: dict[str, dict] = {}

    def fake_free_form(chunks, **kwargs):
        calls["free_form"] = {"chunks": chunks, **kwargs}
        return "CLIP 1 — verbatim quote"

    def fake_pack(chunks, **kwargs):
        calls["pack"] = {"chunks": chunks, **kwargs}
        return _pack()

    monkeypatch.setattr(gen, "generate_free_form", fake_free_form)
    monkeypatch.setattr(gen, "generate_content_pack", fake_pack)
    return calls


def test_free_form_returns_both_raw_output_and_pack(spy):
    resp = gen._build_response(
        [_chunk("some transcript text")],
        errors=[],
        groq_key="k",
        openai_key=None,
        custom_prompt="Extract 3 clips verbatim",
        free_form=True,
    )

    # Both pipelines ran…
    assert "free_form" in spy and "pack" in spy
    # …and both results are returned.
    assert resp.raw_output == "CLIP 1 — verbatim quote"
    assert [h.text for h in resp.content_pack.hooks] == ["a hook"]


def test_free_form_pack_is_exportable(spy):
    """The pack half of a hybrid run must carry working CSV/JSON exports."""
    resp = gen._build_response(
        [_chunk("some transcript text")],
        errors=[],
        groq_key="k",
        openai_key=None,
        custom_prompt="Extract 3 clips verbatim",
        free_form=True,
    )
    assert resp.export_json["hooks"] == [{"text": "a hook"}]
    assert "a hook" in resp.export_csv


def test_custom_prompt_does_not_leak_into_pack(spy):
    """A free-form template is an instruction sheet; it must not steer the pack."""
    gen._build_response(
        [_chunk("some transcript text")],
        errors=[],
        groq_key="k",
        openai_key=None,
        custom_prompt="Extract 3 clips verbatim",
        free_form=True,
    )
    assert spy["free_form"]["custom_prompt"] == "Extract 3 clips verbatim"
    assert spy["pack"]["custom_prompt"] is None


def test_standard_generation_has_no_raw_output(spy):
    resp = gen._build_response(
        [_chunk("some transcript text")],
        errors=[],
        groq_key="k",
        openai_key=None,
        custom_prompt="Make it punchy",
        free_form=False,
    )
    assert "free_form" not in spy
    assert resp.raw_output is None
    # A non-free-form custom prompt still steers the pack.
    assert spy["pack"]["custom_prompt"] == "Make it punchy"
