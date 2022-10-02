
import subprocess
import json

from . import filestore
from .task import Task, Worker
from . import helper

from .ws import wsTask
from websocket import create_connection

import asyncio


def work(params):

    if not "url" in params or not "thumbnail" in params:
        t.failed("invalid params")
        return

    # 外部コマンドを実行して出力を得る
    output = subprocess.getoutput(
        f"./ipc/taint --url={params['url']} --thumbnail={params['thumbnail']}.png --width=1080 --height=1080")
    result = None

    # jsonにパースできることを期待するので、うまく行かなければエラー
    try:
        result = json.loads(output)
    except:
        print(output)
        t.failed("internal error")
        return

    # thumbnailはサーバーに送信しておく
    if "thumbnail" in result:
        filestore.push(result["thumbnail"])

    return output


if __name__ == "__main__":
    ID = helper.ID()
    print(ID)
    w = Worker(ID)

    HOST_ADDR = "ws://127.0.0.1/ws/test"
    with wsTask(HOST_ADDR) as tasks:

        while True:
            params = tasks.receive()
            print(params)
            tasks.done(work(params))
