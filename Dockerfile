FROM python:3.11-slim

WORKDIR /app

# Install curl for healthcheck + pip deps (cached layer)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (separate layer so code changes don't bust dep cache)
COPY backend/ ./backend/

# Run as non-root
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]