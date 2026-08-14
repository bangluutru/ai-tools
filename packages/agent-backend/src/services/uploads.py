from __future__ import annotations

import tempfile
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator, Iterable

from fastapi import HTTPException, UploadFile, status

from ..config import settings


PDF_AND_IMAGE_EXTENSIONS = frozenset(
    {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}
)

_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    ".pdf": (b"%PDF-",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".webp": (b"RIFF",),
    ".tif": (b"II*\x00", b"MM\x00*"),
    ".tiff": (b"II*\x00", b"MM\x00*"),
}


@dataclass(frozen=True)
class SavedUpload:
    path: str
    original_name: str
    extension: str
    size: int


def _safe_original_name(file: UploadFile) -> str:
    name = Path(file.filename or "upload").name.strip()
    if not name or name in {".", ".."}:
        return "upload"
    return name[:255]


def _validate_signature(extension: str, header: bytes) -> None:
    signatures = _SIGNATURES.get(extension)
    if not signatures:
        return

    if extension == ".webp":
        valid = header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    else:
        valid = any(header.startswith(signature) for signature in signatures)

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File content does not match the {extension} extension",
        )


async def _save_one(
    file: UploadFile,
    destination: Path,
    allowed_extensions: frozenset[str],
) -> SavedUpload:
    original_name = _safe_original_name(file)
    extension = Path(original_name).suffix.lower()
    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {extension or 'missing extension'}",
        )

    target = destination / f"{uuid.uuid4().hex}{extension}"
    total_size = 0
    header = b""

    try:
        with target.open("xb") as buffer:
            while chunk := await file.read(1024 * 1024):
                if not header:
                    header = chunk[:16]
                total_size += len(chunk)
                if total_size > settings.max_upload_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail=(
                            f"File exceeds the {settings.max_upload_bytes} byte limit: "
                            f"{original_name}"
                        ),
                    )
                buffer.write(chunk)
    finally:
        await file.close()

    if total_size == 0:
        raise HTTPException(status_code=400, detail=f"Empty file: {original_name}")

    _validate_signature(extension, header)
    return SavedUpload(str(target), original_name, extension, total_size)


@asynccontextmanager
async def saved_uploads(
    files: Iterable[UploadFile],
    *,
    allowed_extensions: frozenset[str] = PDF_AND_IMAGE_EXTENSIONS,
) -> AsyncIterator[list[SavedUpload]]:
    upload_list = list(files)
    if not upload_list:
        raise HTTPException(status_code=400, detail="No files uploaded")
    if len(upload_list) > settings.max_upload_files:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Too many files; maximum is {settings.max_upload_files}",
        )

    with tempfile.TemporaryDirectory(prefix="ai-tools-upload-") as temp_dir:
        destination = Path(temp_dir)
        saved: list[SavedUpload] = []
        for file in upload_list:
            saved.append(await _save_one(file, destination, allowed_extensions))
        yield saved
