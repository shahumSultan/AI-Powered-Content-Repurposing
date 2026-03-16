FROM python:3.11-slim

WORKDIR /app

# System deps needed if llama-cpp-python falls back to source build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install all deps except llama-cpp-python
RUN pip install --no-cache-dir $(grep -iv 'llama' requirements.txt | tr '\n' ' ')

# Prefer prebuilt CPU wheel, but allow source build if no wheel matches
RUN pip install --no-cache-dir --prefer-binary \
    "llama-cpp-python==0.3.16" \
    --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu

# Pre-download embedding model into image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY backend/ ./backend/

RUN mkdir -p models

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]