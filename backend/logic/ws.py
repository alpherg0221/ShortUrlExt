from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import json
import time
import asyncio

import sys

router = APIRouter()


class Task:
    def __init__(self, params: dict):
        self.params = params
        self.event = asyncio.Queue()

    async def done(self, result):
        await self.event.put(result)

    async def wait(self):
        return await self.event.get()


TaskQueue = asyncio.Queue()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    try:
        while True:
            task = await TaskQueue.get()
            await websocket.send_json(task.params)
            await task.done(await websocket.receive_json())
    except WebSocketDisconnect:
        pass
