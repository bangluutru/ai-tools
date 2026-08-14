from io import BytesIO
from types import SimpleNamespace
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile

from src.services import uploads


def upload(name: str, content: bytes) -> UploadFile:
    return UploadFile(filename=name, file=BytesIO(content))


@pytest.mark.asyncio
async def test_upload_uses_random_temp_name_and_strips_path_components():
    source = upload("../../invoice.pdf", b"%PDF-1.7\nexample")
    async with uploads.saved_uploads([source]) as saved:
        item = saved[0]
        assert item.original_name == "invoice.pdf"
        assert Path(item.path).name != "invoice.pdf"
        assert Path(item.path).suffix == ".pdf"
        assert Path(item.path).read_bytes().startswith(b"%PDF-")


@pytest.mark.asyncio
async def test_upload_rejects_extension_signature_mismatch():
    source = upload("invoice.pdf", b"not a pdf")
    with pytest.raises(HTTPException) as exc_info:
        async with uploads.saved_uploads([source]):
            pass
    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_upload_enforces_streamed_file_size(monkeypatch):
    monkeypatch.setattr(
        uploads,
        "settings",
        SimpleNamespace(max_upload_bytes=5, max_upload_files=2),
    )
    source = upload("invoice.pdf", b"%PDF-123456")
    with pytest.raises(HTTPException) as exc_info:
        async with uploads.saved_uploads([source]):
            pass
    assert exc_info.value.status_code == 413


@pytest.mark.asyncio
async def test_upload_rejects_too_many_files(monkeypatch):
    monkeypatch.setattr(
        uploads,
        "settings",
        SimpleNamespace(max_upload_bytes=100, max_upload_files=1),
    )
    sources = [
        upload("a.pdf", b"%PDF-a"),
        upload("b.pdf", b"%PDF-b"),
    ]
    with pytest.raises(HTTPException) as exc_info:
        async with uploads.saved_uploads(sources):
            pass
    assert exc_info.value.status_code == 413
