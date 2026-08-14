from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routes import agents, invoices, jobs
from .config import settings
from .services.antigravity_gateway import AntigravityUnavailableError

app = FastAPI(title="AI Tools - Antigravity Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def reject_oversized_requests(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            request_size = int(content_length)
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
        if request_size > settings.max_request_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                content={"detail": "Request body exceeds the configured limit"},
            )
    return await call_next(request)


@app.exception_handler(AntigravityUnavailableError)
async def antigravity_unavailable_handler(
    _request: Request, exc: AntigravityUnavailableError
):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc), "retryable": exc.retryable},
    )

app.include_router(agents.router, prefix="/api/agents")
app.include_router(invoices.router, prefix="/api/invoices")
app.include_router(jobs.router, prefix="/api/jobs")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "ai_runtime": "antigravity",
        "ai_runtime_enabled": settings.antigravity_enabled,
        "model_override": settings.antigravity_model,
    }
