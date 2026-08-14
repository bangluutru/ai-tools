from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..agents import document_extractor, translator, field_mapper, layout_generator, classifier, legal_translator
from ..services.uploads import saved_uploads

router = APIRouter()

@router.post("/extract")
async def extract_api(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    async with saved_uploads([file]) as uploads:
        return await document_extractor.extract_document(uploads[0].path)

@router.post("/translate")
async def translate_api(text: str = Form(...), batch_index: int = Form(...), total: int = Form(...)):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    if len(text) > 100_000:
        raise HTTPException(status_code=413, detail="Text exceeds 100,000 characters")
    if batch_index < 1 or total < 1 or batch_index > total:
        raise HTTPException(status_code=400, detail="Invalid batch position")
    result = await translator.translate_document(text, batch_index, total)
    return result

@router.post("/translate-legal")
async def translate_legal_api(text: str = Form(...)):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    if len(text) > 100_000:
        raise HTTPException(status_code=413, detail="Text exceeds 100,000 characters")
    result = await legal_translator.translate_legal_document(text)
    return result

@router.post("/map-fields")
async def map_fields_api(source_headers: list[str], target_headers: list[str], samples: list[list[str]]):
    if not source_headers or not target_headers:
        raise HTTPException(status_code=400, detail="Source and target headers are required")
    if len(source_headers) > 500 or len(target_headers) > 500:
        raise HTTPException(status_code=413, detail="Too many headers")
    if any(len(str(header)) > 500 for header in [*source_headers, *target_headers]):
        raise HTTPException(status_code=413, detail="Header exceeds 500 characters")
    result = await field_mapper.map_fields(source_headers, target_headers, samples)
    return result

@router.post("/generate-layout")
async def generate_layout_api(file: UploadFile = File(...)):
    async with saved_uploads([file]) as uploads:
        result = await layout_generator.generate_layout(uploads[0].path)
        return {"html": result}

@router.post("/classify")
async def classify_api(file: UploadFile = File(...)):
    async with saved_uploads([file]) as uploads:
        return await classifier.classify_document(uploads[0].path)
