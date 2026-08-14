# AI Tools Antigravity Backend

Backend nội bộ cho các miniapp cần upload, quản lý job và suy luận bằng
Antigravity SDK. Frontend không gọi trực tiếp API model của nhà cung cấp.

## Development

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
uvicorn src.server:app --reload --port 8000
```

Các biến môi trường chính:

- `AI_TOOLS_ALLOWED_ORIGINS`: danh sách origin phân tách bằng dấu phẩy.
- `AI_TOOLS_MAX_UPLOAD_BYTES`: giới hạn mỗi file; mặc định 20 MiB.
- `AI_TOOLS_MAX_UPLOAD_FILES`: giới hạn số file; mặc định 20.
- `AI_TOOLS_ANTIGRAVITY_TIMEOUT_SECONDS`: timeout một lượt model; mặc định 120 giây.
- `AI_TOOLS_ANTIGRAVITY_MODEL`: model tùy chọn. Nếu bỏ trống, SDK dùng model đã cấu hình trong Antigravity runtime.

Không cấu hình fallback sang Gemini/OpenAI API. Khi Antigravity không khả dụng,
request phải thất bại rõ ràng để người dùng có thể retry.
