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


def hash(url):
    return hashlib.sha256(url.encode()).hexdigest()


if __name__ == "__main__":
    trace_handler("http://google.com")
