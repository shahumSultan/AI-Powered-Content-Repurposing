from __future__ import annotations

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


def embed(texts: list[str]) -> np.ndarray:
    """Return a (N, 512) float32 TF-IDF matrix for the given texts."""
    vectorizer = TfidfVectorizer(max_features=512, sublinear_tf=True)
    return vectorizer.fit_transform(texts).toarray().astype(np.float32)
