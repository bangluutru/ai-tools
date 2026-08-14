import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..agents import invoice_parser

router = APIRouter()

def save_upload(file: UploadFile) -> str:
    temp_dir = os.path.join(os.getcwd(), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

@router.post("/parse")
async def parse_invoices_api(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    file_paths = []
    for f in files:
        file_paths.append(save_upload(f))
        
    try:
        result = await invoice_parser.parse_invoices(file_paths)
        return result
    finally:
        for fp in file_paths:
            if os.path.exists(fp):
                os.remove(fp)

@router.post("/generate-excel")
async def generate_excel_api(invoice_data: dict):
    # This would take the confirmed JSON and generate an Excel file.
    # Currently just a stub since Phase 3 will handle integration
    return {"status": "success", "message": "Excel generated (stub)"}

@router.post("/validate")
async def validate_api(invoice_data: dict):
    # This could run another agent check to validate before export
    return {"status": "success"}
