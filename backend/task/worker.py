
import subprocess
import json

from . import filestore
from .task import Task, Worker
from . import helper

from .ws import wsTask
from websocket import create_connection

import asyncio
import websockets
import time


def work(params):

    if not "url" in params or not "thumbnail" in params:
        return {"err": "invalid params"}

    # 外部コマンドを実行して出力を得る
    output = subprocess.getoutput(
        f"./ipc/taint --url={params['url']} --thumbnail={params['thumbnail']}.png --width=1080 --height=1080")
    result = None

    # jsonにパースできることを期待するので、うまく行かなければエラー
    try:
        result = json.loads(output)
    except:
        print(output)
        return {"err": "internal server error"}

    # thumbnailはサーバーに送信しておく
    if "thumbnail" in result:
        filestore.push(result["thumbnail"])

    return output


async def main():
    ID = helper.ID()
    print(ID)
    w = Worker(ID)

    HOST_ADDR = "ws://127.0.0.1/ws/test"

    async for websocket in websockets.connect(HOST_ADDR):
        try:
            print("established")
            while True:
                data = await websocket.recv()
                params = json.loads(data)
                await websocket.send(work(params))
        except websockets.ConnectionClosed:
            time.sleep(5)
            continue

if __name__ == "__main__":
    asyncio.run(main())
