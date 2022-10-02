
import subprocess
import json

from . import filestore
from . import helper

import asyncio
import websockets
import time
import datetime


def work(params):

    print(datetime.datetime.now())
    print(params)
    if not "url" in params or not "thumbnail" in params:
        return {"err": "invalid params"}

    print(datetime.datetime.now())
    # 外部コマンドを実行して出力を得る
    output = subprocess.getoutput(
        f"./ipc/taint --fast --url={params['url']} --thumbnail={params['thumbnail']}.png --width=1080 --height=1080")
    result = None

    print(datetime.datetime.now())
    print(output)

    # jsonにパースできることを期待するので、うまく行かなければエラー
    try:
        result = json.loads(output)
    except:
        return {"err": "internal server error"}

    print(datetime.datetime.now())
    # thumbnailはサーバーに送信しておく
    if "thumbnail" in result and result["thumbnail"] != None:
        filestore.push(result["thumbnail"])

    print(datetime.datetime.now())
    return result


async def main():
    ID = helper.ID()
    print(ID)

    HOST_ADDR = f"ws://mws2022.pfpfdev.net/ws/{ID}"
    # HOST_ADDR = f"ws://localhost/ws/{ID}"

    async for websocket in websockets.connect(HOST_ADDR):
        try:
            print("established")
            while True:
                data = await websocket.recv()
                params = json.loads(data)
                result = work(params)
                await websocket.send(json.dumps(result))
        except websockets.ConnectionClosed:
            time.sleep(5)
            continue

if __name__ == "__main__":
    asyncio.run(main())
