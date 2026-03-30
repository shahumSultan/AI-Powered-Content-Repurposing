from pydantic import BaseModel, HttpUrl


class GenerateRequest(BaseModel):
    urls: list[HttpUrl]


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
