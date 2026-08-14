import os
import shutil
import tempfile
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import zipfile

# Import core processor
from backend.invoice_processor import process_invoices

app = FastAPI(title="Invoice Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(BASE_DIR, "template", "Mẫu ĐNTT.xlsx")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# Ensure template exists
if not os.path.exists(TEMPLATE_PATH):
    print(f"WARNING: Template file not found at {TEMPLATE_PATH}")

@app.post("/api/generate-invoice")
async def generate_invoice(files: List[UploadFile] = File(...)):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="Không có file nào được tải lên")

    # Create a temporary directory for processing
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Save all uploaded files to temp_dir
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # If it's a zip file, extract it right away so process_invoices can find everything
            if file.filename.lower().endswith('.zip'):
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)

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

        # Return the generated file
        # Note: We can't immediately delete temp_dir because FileResponse needs to read the file.
        # Temp dir will be cleaned up by OS eventually, or we could use BackgroundTasks for immediate cleanup.
        return FileResponse(
            path=output_path, 
            filename=output_filename,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

# Mount frontend static files last so API routes take precedence
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
