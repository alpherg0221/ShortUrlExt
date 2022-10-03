import asyncio


class Task:
    def __init__(self, token: str, params: dict):
        self.token = token
        self.params = params
        self.event = asyncio.Queue()

    async def done(self, result):
        await self.event.put(result)

    async def wait(self):
        return await self.event.get()


TaskQueue = asyncio.Queue()
