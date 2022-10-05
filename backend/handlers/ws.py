from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect

import base64
import json

from helper.cache import DetailCache
from helper.task import TaskQueue
from helper.utils import remove_empty

from protobuf.task_pb2 import Request

req = Request()
print(req.phase)

router = APIRouter()

task_pb2

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
            await websocket.send_bytes(json.dumps(task.params).encode())
            while True:
                data = json.loads((await websocket.receive_bytes()).decode())
                data = remove_empty(data)
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
                    if not("thumbnail" in data):
                        break
                if data["phase"] == "thumbnail":
                    if not("thumbnail" in data and "data" in data):
                        break
                    try:
                        with open(f'{data["thumbnail"]}.png', "wb") as f:
                            f.write(base64.b64decode(data["data"].encode()))
                    finally:
                        break

    except WebSocketDisconnect:
        isClosed = True
        pass
