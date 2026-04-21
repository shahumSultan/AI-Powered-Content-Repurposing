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


class ContentPack(BaseModel):
    hooks: list[Hook]
    linkedin_posts: list[LinkedInPost]
    ig_captions: list[IGCaption]
    shorts_ideas: list[ShortsIdea]


class GenerateResponse(BaseModel):
    content_pack: ContentPack
    errors: list[str]
    export_json: dict
    export_csv: str
