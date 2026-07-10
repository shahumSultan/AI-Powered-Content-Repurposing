# Ensures the backend package root is on sys.path when pytest runs,
# so tests can import modules the same way the app does
# (e.g. `from services.chunker import chunk_text`).
