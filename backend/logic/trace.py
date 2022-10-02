from inspect import trace
from fastapi import APIRouter, status
import requests
import os
import sys
import base64
import hashlib
import json
from task import filestore
import re
from fastapi.responses import JSONResponse

from logic.ws import TaskQueue, Task
from asyncio import Queue

router = APIRouter()


def isURL(url):
    # https://uibakery.io/regex-library/url-regex-python
    url_pattern = "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$"
    return re.match(url_pattern, 'https://uibakery.io') != None


@router.get("/trace")
async def trace_handler(url):  # shortURLがくる
    if not isURL(url):
        return JSONResponse(status_code=400, content={"err": "invalid url"})
    # ファイル名を用意する
    thumbnail = f"{hash(url)}"  # ハッシュ関数を作る
    # ブラウザ制御コマンドを実行する
    task = Task({
        "url": url,
        "thumbnail": thumbnail
    })
    await TaskQueue.put(task)
    completed = await task.wait()
    result = json.loads(completed["result"])
    if "thumbnail" in result:
        filestore.pull(result["thumbnail"])
    inf = json.loads(completed["result"])

    print(inf)
    if not ("src" in inf and "dst" in inf and "chain" in inf and "info" in inf):
        return JSONResponse(status_code=500, content={"err": "internal server error"})

    # コマンドの出力をjsonの形式にする(outputの形式が分かり次第いろいろ変更)
    keys = ["from_url", "term_url", "chains", "thumbnail", "info"]
    values = [inf["src"], inf["dst"], inf["chain"], thumbnail, inf["info"]]
    output_dict = dict(zip(keys, values))
    return output_dict


def hash(url):
    return hashlib.sha256(url.encode()).hexdigest()


if __name__ == "__main__":
    trace_handler("http://google.com")
