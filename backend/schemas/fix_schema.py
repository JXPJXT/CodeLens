from pydantic import BaseModel

class FixRequest(BaseModel):
    code: str
    language: str

class FixResponse(BaseModel):
    fixed_code: str
    explanation: str
