FROM python:3.11-slim

# Build tools needed to compile llama-cpp-python from source
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first — cached layer, only rebuilds if requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-bake the sentence-transformers embedding model (~90 MB) into the image.
# Avoids a runtime download on every cold start.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY backend/ ./backend/

# Models directory — GGUF file is downloaded at runtime by entrypoint.sh
RUN mkdir -p models

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
