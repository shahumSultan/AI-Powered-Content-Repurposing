const API_BASE = "http://localhost:8000";

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface YouTubeResponse {
  url: string;
  video_id: string;
  transcript: TranscriptSegment[];
}

export interface BlogResponse {
  url: string;
  title: string | null;
  text: string;
}

export interface ShortsIdea {
  title: string;
  what_to_say: string;
  timestamp_start: number | null;
  timestamp_end: number | null;
}

export interface ContentPack {
  hooks: { text: string }[];
  linkedin_posts: { text: string }[];
  twitter_posts: { text: string }[];
  ig_captions: { text: string }[];
  shorts_ideas: ShortsIdea[];
}

export interface GenerateResponse {
  content_pack: ContentPack;
  errors: string[];
  export_json: Record<string, unknown>;
  export_csv: string;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export const fetchYouTubeTranscript = (url: string) =>
  post<YouTubeResponse>("/ingest/youtube", { url });

export const fetchBlogArticle = (url: string) =>
  post<BlogResponse>("/ingest/blog", { url });

export const generateContentPack = (urls: string[]) =>
  post<GenerateResponse>("/generate", { urls });
