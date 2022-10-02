#!/usr/bin/env python

import asyncio
import websockets
import threading
from queue import Queue
import time
import json

class wsTask:
    def __init__(self, host):
        self.host = host
        self.chan = Queue()

        def bg(): return asyncio.run(self.connnector())
        thread1 = threading.Thread(target=bg)
        thread1.start()

    async def connnector(self):
        async for websocket in websockets.connect(self.host):
            try:
                while True:
                    data = await websocket.recv()
                    self.chan.put(data)
            except websockets.ConnectionClosed:
                time.sleep(5)
                continue

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()

    def close(self):
        self.ws.close()

    def receive(self):
        message = self.chan.get()
        data = json.loads(message)
        return message["payload"]

    def done(self, result):
        data = {
            "src": "test",
            "dst": "*",
            "payload": result
        }
        self.ws.send(json.dumps(data))
