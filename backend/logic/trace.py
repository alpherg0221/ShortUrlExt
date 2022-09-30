from inspect import trace
from fastapi import APIRouter
import requests
import os
import sys
import base64
import hashlib
import json

from task import dispatcher

router = APIRouter()

@router.get("/trace")

def trace_handler(url): #shortURLがくる
    d = dispatcher.Dispatcher()
    # ファイル名を用意する
    thumbnail = f"{hash(url)}" #ハッシュ関数を作る
    # ブラウザ制御コマンドを実行する
    disp = dispatcher.Dispatcher()
    disp.register({"url": url, "thumbnail": thumbnail})
    completed = disp.complete()
    result = json.loads(completed["result"])
    if "thumbnail" in result:
        disp.download_thumbnail(result["thumbnail"])
    inf = json.loads(completed["result"])
    disp.close()

    # コマンドの出力をjsonの形式にする(outputの形式が分かり次第いろいろ変更)
    keys = ["from_url", "term_url", "chains", "thums"]
    values = [inf["src"], inf["dst"], inf["chain"], inf["thumbnail"]]
    output_dict = dict(zip(keys, values))
    print(output_dict)
    return output_dict

def hash(url):
    return hashlib.sha256(url.encode()).hexdigest()
    #return base64.b64encode(url.encode())

if __name__ == "__main__":
    trace_handler("http://google.com")

