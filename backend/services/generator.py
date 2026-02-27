"""
Content pack generator — llama-cpp-python local inference.

The GGUF model is loaded lazily on the first call to generate_content_pack().
Set MODEL_PATH in your environment (or .env) to point at the model file.
If inference fails for any reason the stub fallback is returned automatically.
"""

from __future__ import annotations

import json
import logging
import os
import re

from backend.schemas.generate import (
    ContentPack,
    Hook,
    IGCaption,
    LinkedInPost,
    ShortsIdea,
    TwitterPost,
)
from backend.services.chunker import Chunk

logger = logging.getLogger(__name__)

_MODEL_PATH = os.getenv("MODEL_PATH", "models/qwen2.5-3b-instruct-q4_k_m.gguf")
_MAX_PROMPT_WORDS = 1_500   # ~2k input tokens — enough signal, much faster prefill
_TOP_CHUNKS = 3             # ranker already picked the best chunks; 3 is sufficient

_llm = None


def _get_llm():
    global _llm
    if _llm is None:
        from llama_cpp import Llama

        logger.info("Loading model from %s …", _MODEL_PATH)
        _llm = Llama(
            model_path=_MODEL_PATH,
            n_ctx=6144,      # 1.5k-word prompt (~2k tokens) + 2k output + overhead
            n_batch=2048,    # parallel prompt-token processing (faster prefill)
            n_gpu_layers=-1,  # 0 = CPU only; set to -1 to offload all layers to GPU
            verbose=False,
        )
        logger.info("Model loaded.")
    return _llm


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are a professional social-media content strategist. "
    "Your job is to write ORIGINAL, engaging marketing copy inspired by the source material. "
    "Do NOT copy or paraphrase the source text verbatim. "
    "Write in a punchy, conversational tone suited to each platform. "
    "Output raw JSON only — no markdown, no commentary, no code fences."
)

_USER_TEMPLATE = """\
SOURCE MATERIAL:
{source}

Do NOT copy the source text verbatim. Write entirely original marketing copy inspired by the themes, ideas, and insights above.

Generate exactly this JSON structure:
{{
  "hooks": [{{"text": "..."}}, ...],
  "linkedin_posts": [{{"text": "..."}}, ...],
  "ig_captions": [{{"text": "..."}}, ...],
  "shorts_ideas": [
    {{"title": "...", "what_to_say": "...", "timestamp_start": null, "timestamp_end": null}},
    ...
  ]
}}

Rules:
- hooks: exactly 5 items, max 140 chars each, written as attention-grabbing opening lines
- linkedin_posts: exactly 2 items, 90-140 words each, professional tone, end with a call-to-action
- ig_captions: exactly 5 items, 30-60 words each, include 3 relevant hashtags
- shorts_ideas: exactly 3 items; title <=60 chars, what_to_say is 2-3 punchy sentences for the creator to speak on camera
"""


# ---------------------------------------------------------------------------
# JSON parsing + ContentPack assembly
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    text = re.sub(r"```(?:json)?", "", text).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object in model output")
    return json.loads(text[start: end + 1])


def _pack_from_dict(data: dict, chunks: list[Chunk]) -> ContentPack:
    timestamped = [c for c in chunks[:_TOP_CHUNKS] if c.timestamp_start is not None]

    shorts_raw: list[dict] = data.get("shorts_ideas", [])[:3]
    shorts_ideas: list[ShortsIdea] = []
    for i, s in enumerate(shorts_raw):
        ts_start = ts_end = None
        if i < len(timestamped):
            ts_start = timestamped[i].timestamp_start
            ts_end = timestamped[i].timestamp_end
        shorts_ideas.append(
            ShortsIdea(
                title=s.get("title", ""),
                what_to_say=s.get("what_to_say", ""),
                timestamp_start=ts_start,
                timestamp_end=ts_end,
            )
        )

    return ContentPack(
        hooks=[Hook(text=h["text"]) for h in data.get("hooks", [])[:5]],
        linkedin_posts=[LinkedInPost(text=p["text"]) for p in data.get("linkedin_posts", [])[:2]],
        # twitter_posts=[TwitterPost(text=t["text"]) for t in data.get("twitter_posts", [])[:3]],
        ig_captions=[IGCaption(text=c["text"]) for c in data.get("ig_captions", [])[:5]],
        shorts_ideas=shorts_ideas,
    )


# ---------------------------------------------------------------------------
# Stub fallback
# ---------------------------------------------------------------------------

def _stub_pack(chunks: list[Chunk]) -> ContentPack:
    pool = (chunks * 5)[:5]

    def _excerpt(c: Chunk, n: int = 12) -> str:
        words = c.text.split()
        return " ".join(words[:n]) + ("…" if len(words) > n else "")

    return ContentPack(
        hooks=[Hook(text=f"[STUB HOOK {i+1}] {_excerpt(pool[i])}") for i in range(5)],
        linkedin_posts=[
            LinkedInPost(text=f"[STUB LINKEDIN {i+1}]\n\n{pool[i].text[:280]}\n\n#AI")
            for i in range(2)
        ],
        # twitter_posts=[TwitterPost(text=f"[STUB TWEET {i+1}] {_excerpt(pool[i], 18)}") for i in range(3)],
        ig_captions=[IGCaption(text=f"[STUB IG {i+1}] {_excerpt(pool[i], 14)} #AI") for i in range(5)],
        shorts_ideas=[
            ShortsIdea(
                title=f"[STUB SHORTS {i+1}] {_excerpt(pool[i], 6)}",
                what_to_say=pool[i].text[:200],
                timestamp_start=pool[i].timestamp_start,
                timestamp_end=pool[i].timestamp_end,
            )
            for i in range(3)
        ],
    )


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_content_pack(chunks: list[Chunk]) -> ContentPack:
    try:
        llm = _get_llm()

        selected = chunks[:_TOP_CHUNKS]
        source = "\n\n".join(c.text for c in selected)
        words = source.split()
        if len(words) > _MAX_PROMPT_WORDS:
            source = " ".join(words[:_MAX_PROMPT_WORDS])

        response = llm.create_chat_completion(
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": _USER_TEMPLATE.format(source=source)},
            ],
            max_tokens=2048,
            temperature=0.7,
        )
        raw_output = response["choices"][0]["message"]["content"]
        data = _extract_json(raw_output)
        pack = _pack_from_dict(data, chunks)

        # Pad any under-count sections with stub items
        stub = _stub_pack(chunks)

        def _pad(lst: list, target: int, fallback: list) -> list:
            while len(lst) < target:
                lst.append(fallback[len(lst)])
            return lst[:target]

        pack.hooks          = _pad(pack.hooks,          5, stub.hooks)
        pack.linkedin_posts = _pad(pack.linkedin_posts, 2, stub.linkedin_posts)
        # pack.twitter_posts  = _pad(pack.twitter_posts,  3, stub.twitter_posts)
        pack.ig_captions    = _pad(pack.ig_captions,    5, stub.ig_captions)
        pack.shorts_ideas   = _pad(pack.shorts_ideas,   3, stub.shorts_ideas)

        return pack

    except Exception as exc:
        logger.warning("llama-cpp inference failed (%s), using stub fallback.", exc)
        return _stub_pack(chunks)
