import time
from fastapi import APIRouter
from schemas.analyze_schema import AnalyzeRequest, AnalyzeResponse
from services.router import route_analysis
from db.db import save_log

router = APIRouter()

@router.post("/", response_model=AnalyzeResponse)
def analyze_endpoint(request: AnalyzeRequest):
    start_time = time.time()
    
    result = route_analysis(request.code, request.language)
    
    latency_ms = (time.time() - start_time) * 1000
    save_log("/analyze", request.language, latency_ms, result["risk_score"], result["mode"])
    
    return result
