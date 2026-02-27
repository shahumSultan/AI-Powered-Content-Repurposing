# """
# Content pack generator — Qwen2.5-7B-Instruct via HuggingFace transformers.

# The model is loaded lazily on the first call (see model_loader.py).
# If inference fails or returns unparseable JSON the stub fallback is used.
# """

# from __future__ import annotations

# import json
# import logging
# import re

# from backend.schemas.generate import (
#     ContentPack,
#     Hook,
#     IGCaption,
#     LinkedInPost,
#     ShortsIdea,
#     TwitterPost,
# )
# from backend.services.chunker import Chunk

# logger = logging.getLogger(__name__)

# _MAX_PROMPT_WORDS = 6_000
# _TOP_CHUNKS = 10


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------
import os
from ollama import Client

client = Client(host='http://10.255.255.254:11434')

messages = [
  {
    'role': 'user',
    'content': 'Why is the sky blue?',
  },
]

for part in client.chat('gpt-oss:120b', messages=messages, stream=True):
  print(part['message']['content'], end='', flush=True)

#   10.255.255.254