from inspect import trace
from fastapi import APIRouter, status
import requests
import os
import sys
import base64
import hashlib
import json
import re
from fastapi.responses import JSONResponse

from task import filestore

from logic.ws import TaskQueue, Task, DetailCache
from asyncio import Queue
import asyncio

router = APIRouter()


def isURL(url):
    # https://uibakery.io/regex-library/url-regex-python
    url_pattern = "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$"
    return re.match(url_pattern, url) != None


def format_json(token, src):
    if not ("src" in src and "dst" in src and "chain" in src and "info" in src):
        return {"err": "internal server error"}
    return {
        "from_url": src["src"],
        "term_url": src["dst"],
        "chains": src["chain"],
        "thumbnail": token,
        "info": src["info"]
    }


async def issue_task(task):
    await TaskQueue.put(task)
    return await task.wait()


@router.get("/trace")
async def trace_handler(url):  # shortURLがくる
    if not isURL(url):
        return JSONResponse(status_code=400, content={"err": "invalid url"})
    # ファイル名を用意する
    token = f"{hash(url)}"  # ハッシュ関数を作る
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


def hash(url):
    return hashlib.sha256(url.encode()).hexdigest()


if __name__ == "__main__":
    trace_handler("http://google.com")
