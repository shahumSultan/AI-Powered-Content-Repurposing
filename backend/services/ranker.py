from __future__ import annotations
import numpy as np
from backend.services.chunker import Chunk
from backend.services.embedder import embed

_DEDUP_THRESHOLD = 0.85


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def rank(chunks: list[Chunk]) -> list[Chunk]:
    """
    Deduplicate and rank *chunks* by semantic uniqueness.

    1. Embed all chunks.
    2. Greedy dedup: drop a chunk if its max cosine similarity to any
       already-kept chunk exceeds _DEDUP_THRESHOLD.
    3. Rank survivors by information density:
       score = 1 - mean(cosine similarity to all *other* survivors).
       Higher score = more unique = ranked first.
    """
    if not chunks:
        return []

    vectors = embed([c.text for c in chunks])

    # --- Greedy dedup ---
    kept_indices: list[int] = []
    for i, vec in enumerate(vectors):
        if not kept_indices:
            kept_indices.append(i)
            continue
        max_sim = max(
            _cosine_similarity(vec, vectors[j]) for j in kept_indices
        )
        if max_sim < _DEDUP_THRESHOLD:
            kept_indices.append(i)

    if len(kept_indices) == 1:
        return [chunks[kept_indices[0]]]

    kept_vecs = vectors[kept_indices]

    # --- Density ranking ---
    scores: list[float] = []
    for i, vec in enumerate(kept_vecs):
        others = np.delete(kept_vecs, i, axis=0)
        sims = [_cosine_similarity(vec, o) for o in others]
        scores.append(1.0 - float(np.mean(sims)))

    ranked = sorted(zip(scores, kept_indices), key=lambda x: x[0], reverse=True)
    return [chunks[idx] for _, idx in ranked]
