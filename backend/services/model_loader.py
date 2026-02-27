"""
Singleton loader for Qwen2.5-7B-Instruct.

The model is loaded lazily on the first call to get_model_and_tokenizer()
so that uvicorn starts quickly. Subsequent calls return the cached instance.

Requirements: GPU with ≥8 GB VRAM (4-bit quantised via bitsandbytes).
The ~5 GB model weights are downloaded automatically from HuggingFace Hub
on the first run and cached in ~/.cache/huggingface/.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"

_model = None
_tokenizer = None


def get_model_and_tokenizer():
    """Return (model, tokenizer), loading once and caching for the process lifetime."""
    global _model, _tokenizer

    if _model is not None:
        return _model, _tokenizer

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

    logger.info("Loading %s (4-bit quantised) — first request will be slow…", MODEL_ID)

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)

    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=quant_config,
        device_map="auto",
        trust_remote_code=True,
    )
    _model.eval()

    logger.info("Model loaded successfully.")
    return _model, _tokenizer
