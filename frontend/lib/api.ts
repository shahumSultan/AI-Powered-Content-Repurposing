const API_BASE = "http://localhost:8001";

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

async function post<T>(path: string, body: { url: string }): Promise<T> {
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
