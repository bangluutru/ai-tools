from fastapi import APIRouter, UploadFile, File, HTTPException
from ..agents import invoice_parser
from ..services.uploads import saved_uploads

router = APIRouter()

@router.post("/parse")
async def parse_invoices_api(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    async with saved_uploads(files) as uploads:
        return await invoice_parser.parse_invoices(
            [upload.path for upload in uploads],
            [upload.original_name for upload in uploads],
        )

@router.post("/generate-excel")
async def generate_excel_api(invoice_data: dict):
    raise HTTPException(
        status_code=501,
        detail="Template-based payment request export is not implemented yet",
    )

@router.post("/validate")
async def validate_api(invoice_data: dict):
    raise HTTPException(
        status_code=501,
        detail="Invoice validation workflow is not implemented yet",
    )
