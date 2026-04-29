from pydantic import BaseModel
from typing import List

class AnalyzeRequest(BaseModel):
    code: str
    language: str  # "c", "python", "javascript", "java", "unknown"

class LineRisk(BaseModel):
    line: int
    score: float

class AnalyzeResponse(BaseModel):
    risk_score: float       # overall bug probability 0-1
    is_buggy: bool          # risk_score >= threshold
    risky_lines: List[LineRisk]
    mode: str               # "cnn" or "heuristic"
