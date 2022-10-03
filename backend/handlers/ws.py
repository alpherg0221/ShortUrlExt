from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect

import base64

from helper.cache import DetailCache
from helper.task import TaskQueue

router = APIRouter()

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
                            f.write(base64.b64decode(data["data"].encode()))
                    except:
                        break

    except WebSocketDisconnect:
        isClosed = True
        pass
