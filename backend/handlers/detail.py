from fastapi import APIRouter
from fastapi.responses import JSONResponse

import asyncio

from helper.utils import format_json
from helper.task import Task,TaskQueue
from helper.cache import DetailCache

router = APIRouter()


@router.get("/detail")
async def trace_handler(token):  # shortURLがくるhtt

    timeout = 30  # sec
    polling_interval = 0.25  # sec
    counter = timeout / polling_interval
    while not DetailCache.exists(token):
        counter -= 1
        await asyncio.sleep(polling_interval)
        if counter <= 0:
            return JSONResponse(status_code=404, content={"err": "not found"})

    msg = format_json(token, DetailCache.load(token))
    print(msg)
    if "err" in msg:
        DetailCache.clear(token)
        return JSONResponse(status_code=500, content=msg)
    return msg

