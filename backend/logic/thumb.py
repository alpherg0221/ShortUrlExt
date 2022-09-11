from fastapi import APIRouter

router = APIRouter()

@router.get("/thumbnail")
async def thumbnail_handler(token: str, size: int=400):
    return {}
