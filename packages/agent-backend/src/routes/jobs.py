from fastapi import APIRouter

router = APIRouter()

# Placeholder for async job management
@router.get("/")
async def list_jobs():
    return {"status": "not_implemented", "jobs": []}
