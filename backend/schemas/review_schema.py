from pydantic import BaseModel

class ReviewRequest(BaseModel):
    code: str
    language: str
    line: int | None = None  # optional: focus on a specific line

class ReviewResponse(BaseModel):
    comment: str
    prompt_type: str  # which template was used
    cached: bool
