import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import List
from fastapi import BackgroundTasks, FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import core processor
from backend.invoice_processor import process_invoices

app = FastAPI(title="Invoice Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

MAX_UPLOAD_FILES = 50
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_EXTENSIONS = {".xml", ".pdf", ".zip"}

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(BASE_DIR, "template", "Mẫu ĐNTT.xlsx")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Ensure template exists
if not os.path.exists(TEMPLATE_PATH):
    print(f"WARNING: Template file not found at {TEMPLATE_PATH}")

@app.post("/api/generate-invoice")
async def generate_invoice(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")

    if len(files) > MAX_UPLOAD_FILES:
        raise HTTPException(status_code=413, detail=f"Tối đa {MAX_UPLOAD_FILES} file")

    temp_dir = tempfile.mkdtemp(prefix="ai-tools-invoice-")
    
    try:
        # Save all uploaded files to temp_dir
        for file in files:
            original_name = Path(file.filename or "upload").name
            extension = Path(original_name).suffix.lower()
            if extension not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=415, detail=f"Không hỗ trợ: {original_name}")
            file_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}{extension}")
            total_size = 0
            with open(file_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):
                    total_size += len(chunk)
                    if total_size > MAX_UPLOAD_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail=f"{original_name} vượt giới hạn {MAX_UPLOAD_BYTES} byte",
                        )
                    buffer.write(chunk)
            await file.close()

        # Output Excel file path
        output_filename = "ĐNTT_auto_generated.xlsx"
        output_path = os.path.join(temp_dir, output_filename)

        # Run core processing logic
        try:
            process_invoices(input_dir=temp_dir, template_path=TEMPLATE_PATH, output_path=output_path)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý hoá đơn: {str(e)}")

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Lỗi không xác định: Không tạo được file ĐNTT")

        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        return FileResponse(
            path=output_path, 
            filename=output_filename,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except HTTPException:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

# Mount frontend static files last so API routes take precedence
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
