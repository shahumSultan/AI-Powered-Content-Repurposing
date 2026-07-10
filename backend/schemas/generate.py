from pydantic import BaseModel, HttpUrl, field_validator


class GenerateRequest(BaseModel):
    urls: list[HttpUrl]

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v):
        if not v:
            raise ValueError("At least one URL is required")
        if len(v) > 5:
            raise ValueError("Maximum 5 URLs per request")
        return v


class GenerateTextRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if len(v.strip()) < 50:
            raise ValueError("Text must be at least 50 characters")
        return v.strip()


class Hook(BaseModel):
    text: str


class LinkedInPost(BaseModel):
    text: str


class IGCaption(BaseModel):
    text: str


class ShortsIdea(BaseModel):
    title: str
    what_to_say: str
    timestamp_start: float | None = None
    timestamp_end: float | None = None
    word_count: int | None = None


class XThread(BaseModel):
    tweets: list[str]   # 3–5 tweets, each ≤280 chars


class MetaCaption(BaseModel):
    primary_text: str   # ≤125 chars, key message front-loaded in first 80
    headline: str       # ≤27 chars, benefit-driven
    description: str    # ≤30 chars, CTA or value-prop reinforcement


class ContentPack(BaseModel):
    hooks: list[Hook]
    linkedin_posts: list[LinkedInPost]
    ig_captions: list[IGCaption]
    shorts_ideas: list[ShortsIdea]
    x_threads: list[XThread] = []
    meta_caption: MetaCaption | None = None


class GenerateResponse(BaseModel):
    content_pack: ContentPack
    errors: list[str]
    export_json: dict
    export_csv: str
    raw_output: str | None = None
