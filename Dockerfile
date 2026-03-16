FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Install all deps except llama-cpp-python
RUN pip install --no-cache-dir $(grep -iv 'llama' requirements.txt | tr '\n' ' ')

# Install llama-cpp-python from pre-built CPU wheel — no C++ compilation needed
RUN pip install --no-cache-dir \
    "llama-cpp-python==0.3.16" \
    --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu

# Pre-bake the sentence-transformers embedding model into the image layer
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY backend/ ./backend/

# Models directory — GGUF file is downloaded at runtime by entrypoint.sh
RUN mkdir -p models

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
