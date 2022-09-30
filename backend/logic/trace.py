from inspect import trace
from fastapi import APIRouter
import requests
import os
import sys
import base64
import hashlib
import json
sys.path.append("./ipc/")
import dispatcher
import task
import filestore

router = APIRouter()

@router.get("/trace")

def trace_handler(url): #shortURLがくる
    # ファイル名を用意する
    thumbnail = f"{hash(url)}" #ハッシュ関数を作る
    # ブラウザ制御コマンドを実行する
    t = task.Task()
    completed = t.run({"url": url, "thumbnail": thumbnail})
    result = json.loads(completed["result"])
    if "thumbnail" in result:
        filestore.pull(result["thumbnail"])
    inf = json.loads(completed["result"])

    # コマンドの出力をjsonの形式にする(outputの形式が分かり次第いろいろ変更)
    keys = ["from_url", "term_url", "chains", "thums"]
    values = [inf["src"], inf["dst"], inf["chain"], inf["thumbnail"]]
    output_dict = dict(zip(keys, values))
    return output_dict

def hash(url):
    return hashlib.sha256(url.encode()).hexdigest()

if __name__ == "__main__":
    trace_handler("http://google.com")

