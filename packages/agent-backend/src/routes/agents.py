import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..agents import document_extractor, translator, field_mapper, layout_generator, classifier, legal_translator

router = APIRouter()

# Helper to save upload file temporarily
def save_upload(file: UploadFile) -> str:
    temp_dir = os.path.join(os.getcwd(), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

@router.post("/extract")
async def extract_api(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_path = save_upload(file)
    try:
        result = await document_extractor.extract_document(file_path)
        return result
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/translate")
async def translate_api(text: str = Form(...), batch_index: int = Form(...), total: int = Form(...)):
    result = await translator.translate_document(text, batch_index, total)
    return result

@router.post("/translate-legal")
async def translate_legal_api(text: str = Form(...)):
    result = await legal_translator.translate_legal_document(text)
    return result

@router.post("/map-fields")
async def map_fields_api(source_headers: list[str], target_headers: list[str], samples: list[list[str]]):
    result = await field_mapper.map_fields(source_headers, target_headers, samples)
    return result

@router.post("/generate-layout")
async def generate_layout_api(file: UploadFile = File(...)):
    file_path = save_upload(file)
    try:
        result = await layout_generator.generate_layout(file_path)
        return {"html": result}
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/classify")
async def classify_api(file: UploadFile = File(...)):
    file_path = save_upload(file)
    try:
        result = await classifier.classify_document(file_path)
        return result
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
