from __future__ import annotations
import io
import os
import tempfile
from schemas.ingest import TranscriptSegment

_local_model = None


def _get_local_model():
    global _local_model
    if _local_model is None:
        from faster_whisper import WhisperModel
        _local_model = WhisperModel("base", device="cpu", compute_type="int8")
    return _local_model


def transcribe(
    audio_bytes: bytes,
    openai_api_key: str | None = None,
) -> tuple[str, list[TranscriptSegment]]:
    if openai_api_key:
        return _transcribe_openai(audio_bytes, openai_api_key)
    return _transcribe_local(audio_bytes)


def _transcribe_openai(audio_bytes: bytes, api_key: str) -> tuple[str, list[TranscriptSegment]]:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.mp3"

    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",
        timestamp_granularities=["segment"],
    )

    segments = [
        TranscriptSegment(
            text=seg.text.strip(),
            start=seg.start,
            duration=seg.end - seg.start,
        )
        for seg in (response.segments or [])
        if seg.text.strip()
    ]
    full_text = response.text or " ".join(s.text for s in segments)
    return full_text, segments


def _transcribe_local(audio_bytes: bytes) -> tuple[str, list[TranscriptSegment]]:
    model = _get_local_model()

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        segs_iter, _ = model.transcribe(tmp_path, beam_size=5)
        segments = []
        texts = []
        for seg in segs_iter:
            text = seg.text.strip()
            if not text:
                continue
            segments.append(TranscriptSegment(
                text=text,
                start=seg.start,
                duration=seg.end - seg.start,
            ))
            texts.append(text)
        full_text = " ".join(texts)
        return full_text, segments
    finally:
        os.unlink(tmp_path)
