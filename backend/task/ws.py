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
        pass

    def __enter__(self):
        return self

    async def __exit__(self, exc_type, exc_value, traceback):
        asyncio.run(self.close())

    async def close(self):
        await self.ws.close()

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
