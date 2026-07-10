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
    MetaCaption,
    ShortsIdea,
    XThread,
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
  ],
  "x_threads": [{{"tweets": ["tweet 1", "tweet 2", ...]}}],
  "meta_caption": {{"primary_text": "...", "headline": "...", "description": "..."}}
}}

Rules:
- hooks: exactly 5 items, max 140 chars each, written as attention-grabbing opening lines
- linkedin_posts: exactly 2 items, 90-140 words each, professional tone, end with a call-to-action
- ig_captions: exactly 5 items, 30-60 words each, include 3 relevant hashtags
- shorts_ideas: exactly 3 items; title <=60 chars, what_to_say MUST be 75-150 words — a complete script the creator speaks on camera, lasting 30-60 seconds at a natural pace
- x_threads: exactly 1 item; 3-5 tweets each ≤280 chars, conversational tone, last tweet ends with a CTA
- meta_caption: exactly 1 object for a Meta (Facebook/Instagram) ad-style caption. primary_text: max 125 chars, front-load the key message in the first 80 chars, conversational or question-led, one CTA at the end. headline: max 27 chars, benefit-driven, urgency or curiosity. description: max 30 chars, short reinforcement of the CTA or value prop. NO hashtags in any meta_caption field.
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


_SHORT_MAX_SECONDS = 60.0


def _clip_window(start: float | None) -> tuple[float | None, float | None]:
    """Turn a chunk start time into a tight Shorts clip window (max 60s)."""
    if start is None:
        return None, None
    return start, start + _SHORT_MAX_SECONDS


def _select_clip_chunks(chunks: list[Chunk], limit: int = 3) -> list[Chunk]:
    """Pick up to *limit* timestamped chunks (in ranked order) whose start times
    are at least 60s apart, so no two Shorts point at overlapping moments."""
    selected: list[Chunk] = []
    for c in chunks:
        if len(selected) >= limit:
            break
        if c.timestamp_start is None:
            continue
        if all(
            abs(c.timestamp_start - s.timestamp_start) >= _SHORT_MAX_SECONDS
            for s in selected
        ):
            selected.append(c)
    return selected


def _pack_from_dict(data: dict, chunks: list[Chunk]) -> ContentPack:
    timestamped = _select_clip_chunks(chunks)

    shorts_raw: list[dict] = data.get("shorts_ideas", [])[:3]
    shorts_ideas: list[ShortsIdea] = []
    for i, s in enumerate(shorts_raw):
        ts_start = ts_end = None
        if i < len(timestamped):
            ts_start, ts_end = _clip_window(timestamped[i].timestamp_start)
        what_to_say = s.get("what_to_say", "")
        shorts_ideas.append(
            ShortsIdea(
                title=s.get("title", ""),
                what_to_say=what_to_say,
                timestamp_start=ts_start,
                timestamp_end=ts_end,
                word_count=len(what_to_say.split()) or None,
            )
        )

    x_threads_raw: list[dict] = data.get("x_threads", [])[:1]
    x_threads = [
        XThread(tweets=[t for t in x.get("tweets", [])[:5] if isinstance(t, str)])
        for x in x_threads_raw
    ]

    meta_raw = data.get("meta_caption")
    meta_caption = None
    if isinstance(meta_raw, dict):
        meta_caption = MetaCaption(
            primary_text=str(meta_raw.get("primary_text", "")),
            headline=str(meta_raw.get("headline", "")),
            description=str(meta_raw.get("description", "")),
        )

    return ContentPack(
        hooks=[Hook(text=h["text"]) for h in data.get("hooks", [])[:5]],
        linkedin_posts=[LinkedInPost(text=p["text"]) for p in data.get("linkedin_posts", [])[:2]],
        ig_captions=[IGCaption(text=c["text"]) for c in data.get("ig_captions", [])[:5]],
        shorts_ideas=shorts_ideas,
        x_threads=x_threads,
        meta_caption=meta_caption,
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
                timestamp_start=_clip_window(pool[i].timestamp_start)[0],
                timestamp_end=_clip_window(pool[i].timestamp_start)[1],
                word_count=len(pool[i].text[:200].split()) or None,
            )
            for i in range(3)
        ],
        x_threads=[XThread(tweets=[f"[STUB X TWEET {i+1}] {_excerpt(pool[0], 10)}" for i in range(3)])],
        meta_caption=MetaCaption(
            primary_text=f"[STUB META] {_excerpt(pool[0], 12)}",
            headline="[STUB] Headline",
            description="[STUB] Description",
        ),
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
  ],
  "x_threads": [{"tweets": ["tweet 1", "tweet 2", ...]}],
  "meta_caption": {"primary_text": "...", "headline": "...", "description": "..."}
}
Rules:
- hooks: exactly 5 items, max 140 chars each, attention-grabbing opening lines
- linkedin_posts: exactly 2 items, 90-140 words each, professional tone, end with a CTA
- ig_captions: exactly 5 items, 30-60 words each, include 3 relevant hashtags
- shorts_ideas: exactly 3 items; title ≤60 chars, what_to_say MUST be 75-150 words — a complete script the creator speaks on camera, lasting 30-60 seconds at a natural pace
- x_threads: exactly 1 item; 3-5 tweets each ≤280 chars, conversational tone, last tweet ends with a CTA
- meta_caption: exactly 1 object for a Meta (Facebook/Instagram) ad-style caption; primary_text ≤125 chars with the key message in the first 80 and one CTA; headline ≤27 chars, benefit-driven; description ≤30 chars reinforcing the CTA; NO hashtags"""


def _build_user_message(
    source: str,
    custom_prompt: str | None,
    brand_kit_context: str | None = None,
) -> str:
    prefix = (brand_kit_context + "\n\n") if brand_kit_context else ""
    if custom_prompt:
        if "{source}" in custom_prompt:
            base = custom_prompt.format(source=source)
        else:
            base = custom_prompt + "\n\nSOURCE MATERIAL:\n" + source
        if '"hooks"' not in base:
            base += "\n\n" + _JSON_STRUCTURE_REQUIREMENT
        return prefix + base
    return prefix + _USER_TEMPLATE.format(source=source)


def _call_groq(client: Groq, source: str, custom_prompt: str | None = None, brand_kit_context: str | None = None) -> str:
    response = client.chat.completions.create(
        model=_GROQ_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(source, custom_prompt, brand_kit_context)},
        ],
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content


def _call_openai(client: OpenAI, source: str, custom_prompt: str | None = None, brand_kit_context: str | None = None) -> str:
    response = client.chat.completions.create(
        model=_OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(source, custom_prompt, brand_kit_context)},
        ],
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# Free-form output (custom prompt, no JSON enforcement)
# ---------------------------------------------------------------------------

_FREE_FORM_SYSTEM_PROMPT = (
    "You are a helpful content assistant. "
    "Follow the user's instructions exactly, including any required output format, "
    "exact required sentences, and final checklists. "
    "When the instructions ask you to extract or quote from the source material, "
    "copy the exact wording — never paraphrase, summarize, or invent dialogue."
)

# Free-form prompts (e.g. verbatim clip extraction) need the whole transcript
# in original order, not the ranked highlights the pack pipeline uses.
_FREE_FORM_MAX_PROMPT_WORDS = 8_000


def _format_ts(seconds: float) -> str:
    total = int(seconds)
    hours, rem = divmod(total, 3600)
    minutes, secs = divmod(rem, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def _build_free_form_source(chunks: list[Chunk]) -> str:
    """Join chunks in original document order, prefixing each with its timestamp."""
    parts = []
    for c in chunks:
        if c.timestamp_start is not None:
            parts.append(f"[{_format_ts(c.timestamp_start)}] {c.text}")
        else:
            parts.append(c.text)
    source = "\n\n".join(parts)
    words = source.split()
    if len(words) > _FREE_FORM_MAX_PROMPT_WORDS:
        source = " ".join(words[:_FREE_FORM_MAX_PROMPT_WORDS])
    return source


def generate_free_form(
    chunks: list[Chunk],
    *,
    custom_prompt: str,
    groq_api_key: str | None = None,
    openai_api_key: str | None = None,
    brand_kit_context: str | None = None,
) -> str:
    if openai_api_key:
        llm_client: OpenAI | Groq = OpenAI(api_key=openai_api_key)
        use_openai = True
    elif groq_api_key:
        llm_client = Groq(api_key=groq_api_key)
        use_openai = False
    else:
        env_client = _get_env_groq_client()
        if env_client is None:
            raise NoApiKeyError("No AI API key configured. Please add your API key in Settings.")
        llm_client = env_client
        use_openai = False

    source = _build_free_form_source(chunks)

    prefix = (brand_kit_context + "\n\n") if brand_kit_context else ""
    if "{source}" in custom_prompt:
        user_message = prefix + custom_prompt.format(source=source)
    else:
        user_message = prefix + custom_prompt + "\n\nSOURCE MATERIAL:\n" + source

    model = _OPENAI_MODEL if use_openai else _GROQ_MODEL
    client_obj = llm_client  # type: ignore[assignment]
    response = client_obj.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _FREE_FORM_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        # verbatim clip extraction (3 clips + phrases + captions + checklist)
        # regularly overflows 2048
        max_tokens=4096,
        temperature=0.7,
    )
    return response.choices[0].message.content or ""


# ---------------------------------------------------------------------------
# Single-item regeneration
# ---------------------------------------------------------------------------

_SINGLE_ITEM_PROMPTS: dict[str, str] = {
    "hook": (
        "Write exactly 1 new attention-grabbing hook (max 140 characters) inspired by this content. "
        'Output raw JSON only: {"text": "..."}'
    ),
    "linkedin": (
        "Write exactly 1 new LinkedIn post (90-140 words, professional tone, end with a CTA) inspired by this content. "
        'Output raw JSON only: {"text": "..."}'
    ),
    "ig_caption": (
        "Write exactly 1 new Instagram caption (30-60 words, include 3 relevant hashtags) inspired by this content. "
        'Output raw JSON only: {"text": "..."}'
    ),
    "shorts_idea": (
        "Write exactly 1 new YouTube Shorts idea inspired by this content. "
        'Output raw JSON only: {"title": "...", "what_to_say": "..."} '
        "where title is ≤60 chars and what_to_say MUST be 75-150 words — a complete script the creator speaks on camera, lasting 30-60 seconds at a natural pace."
    ),
    "x_thread": (
        "Write exactly 1 new Twitter/X thread (3-5 tweets, each ≤280 chars) inspired by this content. "
        "Conversational tone. Last tweet ends with a CTA. "
        'Output raw JSON only: {"tweets": ["tweet 1", "tweet 2", ...]}'
    ),
    "meta_caption": (
        "Write exactly 1 new Meta (Facebook/Instagram) ad-style caption inspired by this content. "
        'Output raw JSON only: {"primary_text": "...", "headline": "...", "description": "..."} '
        "where primary_text is ≤125 chars with the key message front-loaded in the first 80 chars and one CTA at the end, "
        "headline is ≤27 chars and benefit-driven, description is ≤30 chars reinforcing the CTA. NO hashtags."
    ),
}

_SINGLE_ITEM_SYSTEM = (
    "You are a professional social-media content strategist. "
    "Output raw JSON only — no markdown, no code fences, no commentary."
)


def generate_single_item(
    item_type: str,
    context: str,
    *,
    groq_api_key: str | None = None,
    openai_api_key: str | None = None,
) -> dict:
    if openai_api_key:
        llm_client: OpenAI | Groq = OpenAI(api_key=openai_api_key)
        use_openai = True
    elif groq_api_key:
        llm_client = Groq(api_key=groq_api_key)
        use_openai = False
    else:
        env_client = _get_env_groq_client()
        if env_client is None:
            raise NoApiKeyError("No AI API key configured. Please add your API key in Settings.")
        llm_client = env_client
        use_openai = False

    prompt = _SINGLE_ITEM_PROMPTS.get(item_type, "")
    user_message = f"{prompt}\n\nSOURCE CONTENT:\n{context[:1200]}"
    model = _OPENAI_MODEL if use_openai else _GROQ_MODEL

    response = llm_client.chat.completions.create(  # type: ignore[union-attr]
        model=model,
        messages=[
            {"role": "system", "content": _SINGLE_ITEM_SYSTEM},
            {"role": "user", "content": user_message},
        ],
        max_tokens=512,
        temperature=0.85,
    )
    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_content_pack(
    chunks: list[Chunk],
    *,
    custom_prompt: str | None = None,
    groq_api_key: str | None = None,
    openai_api_key: str | None = None,
    brand_kit_context: str | None = None,
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
            raw_output = _call_openai(llm_client, source, custom_prompt, brand_kit_context)
            logger.info("Generated with user-supplied OpenAI key.")
        else:
            raw_output = _call_groq(llm_client, source, custom_prompt, brand_kit_context)
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
        pack.x_threads      = _pad(pack.x_threads,      1, stub.x_threads)
        # meta_caption is deliberately NOT stub-padded: older custom prompt
        # templates produce the pre-meta_caption schema, and surfacing stub
        # text as real ad copy would be worse than showing none.

        return pack

    except Exception as exc:
        logger.warning("Inference failed (%s), using stub fallback.", exc)
        return _stub_pack(chunks)
