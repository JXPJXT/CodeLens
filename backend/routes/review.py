import time
from fastapi import APIRouter
from schemas.review_schema import ReviewRequest, ReviewResponse
from services.llm_service import get_review_from_llm
from services.router import route_analysis
from db.db import save_log

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
def review_endpoint(request: ReviewRequest):
    start_time = time.time()
    
    code_to_review = request.code
    if request.line is not None:
        lines = request.code.split('\n')
        start = max(0, request.line - 5)
        end = min(len(lines), request.line + 6)
        context = "\n".join(lines[start:end])
        code_to_review = context

    analysis = route_analysis(request.code, request.language)
    
    result = get_review_from_llm(code_to_review, request.language, analysis.get("risk_score", 0.5))
    
    latency_ms = (time.time() - start_time) * 1000
    save_log("/review", request.language, latency_ms, analysis.get("risk_score", 0.5), "llm")
    
    return result
