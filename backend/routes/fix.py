from fastapi import APIRouter
from schemas.fix_schema import FixRequest, FixResponse
from services.llm_service import get_fix_from_llm

router = APIRouter()

@router.post("/", response_model=FixResponse)
def fix_endpoint(request: FixRequest):
    result = get_fix_from_llm(request.code, request.language)
    return FixResponse(
        fixed_code=result.get("fixed_code", ""),
        explanation=result.get("explanation", "")
    )
