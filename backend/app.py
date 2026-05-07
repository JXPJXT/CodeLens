from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analyze, review, feedback, fix
from db.db import init_db

app = FastAPI(title="CodeLens API", version="1.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(review.router, prefix="/review", tags=["review"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
app.include_router(fix.router, prefix="/fix", tags=["fix"])

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health():
    return {"status": "ok"}
