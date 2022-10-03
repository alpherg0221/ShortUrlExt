from fastapi import APIRouter
from fastapi.responses import JSONResponse

import asyncio

from helper.utils import sha256, is_url, format_json

from helper.task import Task, TaskQueue
from helper.cache import DetailCache

router = APIRouter()


async def issue_task(task):
    await TaskQueue.put(task)
    return await task.wait()


@router.get("/trace")
async def trace_handler(url):  # shortURLがくる
    if not is_url(url):
        return JSONResponse(status_code=400, content={"err": "invalid url"})
    # ファイル名を用意する
    token = sha256(url)
    # ブラウザ制御コマンドを実行する
    task = Task(
        token,
        {
            "url": url,
            "thumbnail": token
        })

    processing = asyncio.create_task(issue_task(task))

    if DetailCache.exists(token):
        msg = format_json(token, DetailCache.load(token))
        print(msg)
        if "err" in msg:
            return JSONResponse(status_code=500, content=msg)
        return msg

    result = await processing

    # コマンドの出力をjsonの形式にする(outputの形式が分かり次第いろいろ変更)

    msg = format_json(token, result)
    print(msg)
    if "err" in msg:
        return JSONResponse(status_code=500, content=msg)
    return msg
