#!/bin/bash
set -e

# Download GGUF model from HuggingFace Hub if not already present
if [ -n "$HF_MODEL_REPO" ] && [ -n "$HF_MODEL_FILE" ]; then
    MODEL_DEST="models/$HF_MODEL_FILE"
    if [ ! -f "$MODEL_DEST" ]; then
        echo "Downloading model: $HF_MODEL_REPO / $HF_MODEL_FILE"
        python - <<'PYEOF'
import os
from huggingface_hub import hf_hub_download
hf_hub_download(
    repo_id=os.environ["HF_MODEL_REPO"],
    filename=os.environ["HF_MODEL_FILE"],
    local_dir="models",
)
print("Model downloaded.")
PYEOF
    else
        echo "Model already present at $MODEL_DEST"
    fi
fi

exec uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}"
