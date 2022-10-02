from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import json
from queue import Queue

import sys

router = APIRouter()


html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <h2>Your ID: <span id="ws-id"></span></h2>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var client_id = Date.now()
            document.querySelector("#ws-id").textContent = client_id;
            var ws = new WebSocket(`ws://localhost/ws/${client_id}`);
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


class ConnectionManager:
    def __init__(self):
        self.active_connections = {"/": None}
        self.chan = Queue()

    async def connect(self, websocket: WebSocket, addr: str):
        if addr in self.active_connections:
            await websocket.close(code=1000, reason=None)
        await websocket.accept()
        self.active_connections[addr] = websocket

    def disconnect(self, addr: str):
        if addr in self.active_connections:
            del self.active_connections[addr]
        else:
            raise Exception("unkown address")

    async def send_personal_message(self, message: str, addr: str) -> bool:
        if addr in self.active_connections:
            await self.active_connections[addr].send_text(message)
        else:
            raise Exception("unkown address")

    async def broadcast(self, message: str):
        for connection in self.connections():
            await connection.send_text(message)

    async def route(self, src: WebSocket, message: str):
        try:
            data = json.loads(message)
            if not("src" in data and "dst" in data and "payload" in data):
                raise Exception("invalid format")
            if src != self.active_connections[data["src"]]:
                raise Exception("invalid src")
            if data["dst"] == "*":
                await self.broadcast(message)
                self.chan.put(data)
            if data["dst"] == "/":
                self.chan.put(data)
            else:
                print(data)
                await self.send_personal_message(message, data["dst"])
        except Exception as e:
            await src.send_json({"err": "failed to handling", "detail": f"{e}", "info": list(self.active_connections.keys())})

    async def receive(self):
        return self.chan.get()

    def connections(self):
        return self.active_connections.values()


manager = ConnectionManager()


class TaskManager:
    def __init__(self, cons):
        self.cons = cons
        pass

    def create(self, params):
        asyncio.run(self.cons.broadcast(
            json.dumps({"type": "task", "params": params})))
        return self.cons.receive()


tasks = TaskManager(manager)


@router.get("/chat_test")
async def get():
    return HTMLResponse(html)


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.route(websocket, data)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
