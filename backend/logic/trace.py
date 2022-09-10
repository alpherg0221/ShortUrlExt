from fastapi import APIRouter

router = APIRouter()

@router.get("/trace")
async def trace_handler(url: str):
    return {}
