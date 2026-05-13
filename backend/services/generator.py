"""
Content pack generator — Groq (default) or OpenAI.

Priority for API keys:
  1. openai_api_key passed per-request  → use OpenAI
  2. groq_api_key passed per-request    → use Groq with that key
  3. GROQ_API_KEY env var               → use Groq with env key (trial/unauthenticated only)
  4. None of the above                  → raises NoApiKeyError
"""

from __future__ import annotations
import json
import logging
import os
import re
from groq import Groq
from openai import OpenAI
from schemas.generate import (
    ContentPack,
    Hook,
    IGCaption,
    LinkedInPost,
    ShortsIdea,
)
from services.chunker import Chunk

logger = logging.getLogger(__name__)


class NoApiKeyError(Exception):
    pass


_GROQ_MODEL   = "llama-3.3-70b-versatile"
_OPENAI_MODEL = "gpt-4o-mini"
_MAX_PROMPT_WORDS = 1_500
_TOP_CHUNKS = 3

# Module-level singleton for the env-level Groq client only
_env_client: Groq | None = None


def _get_env_groq_client() -> Groq | None:
    global _env_client
    key = os.getenv("GROQ_API_KEY")
    if not key:
        return None
    if _env_client is None:
        _env_client = Groq(api_key=key)
    return _env_client


def load_model() -> None:
    if os.getenv("GROQ_API_KEY"):
        logger.info("Groq API key found — ready.")
    else:
        logger.warning("GROQ_API_KEY not set. User-supplied keys or stub fallback will be used.")


def is_ready() -> bool:
    return bool(os.getenv("GROQ_API_KEY"))


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
# LLM call helpers
# ---------------------------------------------------------------------------

_JSON_STRUCTURE_REQUIREMENT = """\
Generate exactly this JSON structure:
{
  "hooks": [{"text": "..."}, ...],
  "linkedin_posts": [{"text": "..."}, ...],
  "ig_captions": [{"text": "..."}, ...],
  "shorts_ideas": [
    {"title": "...", "what_to_say": "...", "timestamp_start": null, "timestamp_end": null},
    ...
  ]
}
Rules:
- hooks: exactly 5 items, max 140 chars each, attention-grabbing opening lines
- linkedin_posts: exactly 2 items, 90-140 words each, professional tone, end with a CTA
- ig_captions: exactly 5 items, 30-60 words each, include 3 relevant hashtags
- shorts_ideas: exactly 3 items; title ≤60 chars, what_to_say is 2-3 punchy sentences"""


def _build_user_message(source: str, custom_prompt: str | None) -> str:
    if custom_prompt:
        if "{source}" in custom_prompt:
            base = custom_prompt.format(source=source)
        else:
            base = custom_prompt + "\n\nSOURCE MATERIAL:\n" + source
        # Append JSON structure requirement when the user hasn't included it
        if '"hooks"' not in base:
            base += "\n\n" + _JSON_STRUCTURE_REQUIREMENT
        return base
    return _USER_TEMPLATE.format(source=source)


def _call_groq(client: Groq, source: str, custom_prompt: str | None = None) -> str:
    response = client.chat.completions.create(
        model=_GROQ_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(source, custom_prompt)},
        ],
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content


def _call_openai(client: OpenAI, source: str, custom_prompt: str | None = None) -> str:
    response = client.chat.completions.create(
        model=_OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(source, custom_prompt)},
        ],
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_content_pack(
    chunks: list[Chunk],
    *,
    custom_prompt: str | None = None,
    groq_api_key: str | None = None,
    openai_api_key: str | None = None,
) -> ContentPack:
    # Resolve which client to use — raises NoApiKeyError before any LLM call
    if openai_api_key:
        client_type = "openai"
        llm_client = OpenAI(api_key=openai_api_key)
    elif groq_api_key:
        client_type = "groq"
        llm_client = Groq(api_key=groq_api_key)
    else:
        env_client = _get_env_groq_client()
        if env_client is None:
            raise NoApiKeyError(
                "No AI API key configured. Please add your API key in Settings."
            )
        client_type = "groq_env"
        llm_client = env_client

    try:
        selected = chunks[:_TOP_CHUNKS]
        source = "\n\n".join(c.text for c in selected)
        words = source.split()
        if len(words) > _MAX_PROMPT_WORDS:
            source = " ".join(words[:_MAX_PROMPT_WORDS])

        if client_type == "openai":
            raw_output = _call_openai(llm_client, source, custom_prompt)
            logger.info("Generated with user-supplied OpenAI key.")
        else:
            raw_output = _call_groq(llm_client, source, custom_prompt)
            if client_type == "groq":
                logger.info("Generated with user-supplied Groq key.")

        data = _extract_json(raw_output)
        pack = _pack_from_dict(data, chunks)

        stub = _stub_pack(chunks)

        def _pad(lst: list, target: int, fallback: list) -> list:
            while len(lst) < target:
                lst.append(fallback[len(lst)])
            return lst[:target]

        pack.hooks          = _pad(pack.hooks,          5, stub.hooks)
        pack.linkedin_posts = _pad(pack.linkedin_posts, 2, stub.linkedin_posts)
        pack.ig_captions    = _pad(pack.ig_captions,    5, stub.ig_captions)
        pack.shorts_ideas   = _pad(pack.shorts_ideas,   3, stub.shorts_ideas)

        return pack

    except Exception as exc:
        logger.warning("Inference failed (%s), using stub fallback.", exc)
        return _stub_pack(chunks)
