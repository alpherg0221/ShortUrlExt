from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import json
import time
import asyncio

import sys
import base64

router = APIRouter()


class Task:
    def __init__(self, token: str, params: dict):
        self.token = token
        self.params = params
        self.event = asyncio.Queue()

    async def done(self, result):
        await self.event.put(result)

    async def wait(self):
        return await self.event.get()


class Cache:
    def __init__(self):
        self.db = {}

    def store(self, key, value):
        self.db[f"{key}"] = value

    def exists(self, key):
        return f"{key}" in self.db

    def clear(self, key):
        del self.db[f"{key}"]

    def load(self, key):
        return self.db[f"{key}"]


TaskQueue = asyncio.Queue()

DetailCache = Cache()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    isClosed = False
    try:
        while True:
            task = await TaskQueue.get()
            if isClosed:
                await TaskQueue.put(task)
                break
            await websocket.send_json(task.params)
            while True:
                data = await websocket.receive_json()
                if not "phase" in data:
                    await task.done(data)
                    break
                if "err" in data:
                    await task.done(data)
                    break
                if data["phase"] == "fast":
                    await task.done(data)
                if data["phase"] == "detail":
                    DetailCache.store(task.token, data)
                    if not("thumbnail" in data and f'{data["thumbnail"]}'.endswith(".png")):
                        break
                if data["phase"] == "thumbnail":
                    if not("filename" in data and "data" in data):
                        break
                    try:
                        with open(data["filename"], "wb") as f:
                            f.write(base64.b64decode(s))
                    except:
                        break

    except WebSocketDisconnect:
        isClosed = True
        pass
