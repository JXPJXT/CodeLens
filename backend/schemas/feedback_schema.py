from pydantic import BaseModel

class FeedbackRequest(BaseModel):
    code: str
    prediction: float
    correct: bool
    user_comment: str | None = None
