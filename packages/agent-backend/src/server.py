from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import agents, invoices, jobs

app = FastAPI(title="AI Tools - Antigravity Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/api/agents")
app.include_router(invoices.router, prefix="/api/invoices")
app.include_router(jobs.router, prefix="/api/jobs")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
