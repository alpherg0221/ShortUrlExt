from fastapi import APIRouter
import requests
import cv2
import os
import sys
import base64
import hashlib
import json

router = APIRouter()

@router.get("/trace")

def trace_handler(url): #shortURLがくる
    # ファイル名を用意する
    thumbnail = f"{hash(url)}.png" #ハッシュ関数を作る
    # ブラウザ制御コマンドを実行する
    output = exec.run("ikezawa_command {url} {thumbnail}")
    # コマンドの出力をjsonの形式にする(outputの形式が分かり次第いろいろ変更)
    keys = ["from_url", "term_url", "chains", "thums", "info"]
    values = []
    output_dict = json.dump(dict(zip(keys, values)))
    return output_dict

def hash(url):
    #return hashlib.sha256(url.encode()).hexdigest()
    return base64.b64encode(url.encode())
