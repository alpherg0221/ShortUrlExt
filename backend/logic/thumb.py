from fastapi import APIRouter
from fastapi import FastAPI
import os
import cv2
import base64

router = APIRouter()

@router.get("/thumbnail")

def thumbnail_handler(token: str, size: int=400):  # 引数はtoken(画像の識別子)と画像サイズ
  thumb_file = f"{token}_{size}.png"
  
  if not os.path.isfile(thumb_file): # 画像がなければ生成する
    decode_token = base64.b64decode(token).decode()
    original = decode_token + ".png"
    img = cv2.imread(original)
    write_img_file(img, thumb_file, size)
    #cv2.imwrite(thumb_file, img.resize(size))
  # ファイルを送る
  app = FastAPI()
  app.post(thumb_file)

def write_img_file(img, thumb_file, size):
  resize_img = cv2.resize(img, dsize=(size,size))
  cv2.imwrite(thumb_file, resize_img) 
