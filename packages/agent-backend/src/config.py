from __future__ import annotations

import os
from dataclasses import dataclass


def _positive_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    value = int(raw_value)
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return value


def _origins() -> tuple[str, ...]:
    raw_value = os.getenv(
        "AI_TOOLS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    )
    origins = tuple(origin.strip() for origin in raw_value.split(",") if origin.strip())
    if not origins or "*" in origins:
        raise ValueError("AI_TOOLS_ALLOWED_ORIGINS must contain explicit origins")
    return origins


@dataclass(frozen=True)
class Settings:
    allowed_origins: tuple[str, ...]
    max_upload_bytes: int
    max_upload_files: int
    max_request_bytes: int
    antigravity_timeout_seconds: int
    antigravity_model: str | None


def load_settings() -> Settings:
    max_upload_bytes = _positive_int("AI_TOOLS_MAX_UPLOAD_BYTES", 20 * 1024 * 1024)
    max_upload_files = _positive_int("AI_TOOLS_MAX_UPLOAD_FILES", 20)
    return Settings(
        allowed_origins=_origins(),
        max_upload_bytes=max_upload_bytes,
        max_upload_files=max_upload_files,
        max_request_bytes=_positive_int(
            "AI_TOOLS_MAX_REQUEST_BYTES",
            max_upload_bytes * max_upload_files + 1024 * 1024,
        ),
        antigravity_timeout_seconds=_positive_int(
            "AI_TOOLS_ANTIGRAVITY_TIMEOUT_SECONDS", 120
        ),
        antigravity_model=os.getenv("AI_TOOLS_ANTIGRAVITY_MODEL") or None,
    )


settings = load_settings()
