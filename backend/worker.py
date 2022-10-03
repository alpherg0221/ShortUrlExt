
import subprocess
import json

import asyncio
import websockets
import time
import datetime
import base64

import hashlib

def ID():
    import os
    return f"{os.uname()[1]}-{random_str()}"


def random_str():
    return sha256(f'{datetime.datetime.now()}')[:10]


def sha256(seed):
    return hashlib.sha256(seed.encode()).hexdigest()


async def main():
    ID = ID()
    print(ID)

    HOST_ADDR = f"ws://mws2022.pfpfdev.net/ws/{ID}"
    # HOST_ADDR = f"ws://localhost/ws/{ID}"

    async for websocket in websockets.connect(HOST_ADDR):
        try:
            print("established")
            while True:

                # --- 情報を受け取る
                data = await websocket.recv()
                params = json.loads(data)

                print(params)
                if not "url" in params or not "thumbnail" in params:
                    return {"err": "invalid params"}

                result = None

                # --- 第一段階 : HTTP Redirectのみに従いdstにのみアクセスする

                fetch_start = datetime.datetime.now()
                # 外部コマンドを実行して出力を得る
                output = subprocess.getoutput(
                    f"./ipc/taint --fast --url={params['url']}")
                fetch_end = datetime.datetime.now()

                # jsonにパースできることを期待するので、うまく行かなければエラー
                try:
                    result = json.loads(output)
                except:
                    return {"err": "internal server error"}

                result["phase"] = "fast"

                await websocket.send(json.dumps(result))

                print(output)
                print(fetch_end - fetch_start)

                # --- 第二段階 : chromeを用いて詳細分析 & サムネイル取得

                fetch_start = datetime.datetime.now()
                output = subprocess.getoutput(
                    f"./ipc/taint --url={params['url']} --thumbnail={params['thumbnail']}.png --width=1080 --height=1080")
                fetch_end = datetime.datetime.now()

                try:
                    result = json.loads(output)
                except:
                    return {"err": "internal server error"}

                result["phase"] = "detail"

                await websocket.send(json.dumps(result))

                print(output)
                print(fetch_end - fetch_start)

                # --- 第三段階 : サムネイルを送信する

                # thumbnailはサーバーに送信しておく
                if "thumbnail" in result and result["thumbnail"] != None:
                    with open(result["thumbnail"], "rb") as f:
                        b64 = base64.b64encode(f.read())

                        await websocket.send(json.dumps({
                            "phase": "thumbnail",
                            "filename": result["thumbnail"],
                            "data": b64.decode()
                        }))

        except websockets.ConnectionClosed:
            time.sleep(5)
            continue

if __name__ == "__main__":
    asyncio.run(main())
