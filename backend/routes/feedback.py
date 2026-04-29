import time
from fastapi import APIRouter
from schemas.feedback_schema import FeedbackRequest
from db.db import save_feedback, save_log

router = APIRouter()

@router.post("/")
def feedback_endpoint(request: FeedbackRequest):
    start_time = time.time()
    
    save_feedback(request.code, request.prediction, request.correct, request.user_comment)
    
    latency_ms = (time.time() - start_time) * 1000
    save_log("/feedback", "unknown", latency_ms, request.prediction, "feedback")
    
    return {"status": "success"}
