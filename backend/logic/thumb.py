from fastapi import APIRouter
from fastapi import FastAPI
from fastapi.responses import FileResponse
import os
import cv2
import base64
import math

router = APIRouter()


@router.get("/thumbnail")
def thumbnail_handler(token: str, size: int = 400):  # 引数はtoken(画像の識別子)と画像サイズ
    thumb_file = f"{token}_{size}.png"

    if not os.path.isfile(thumb_file):  # 画像がなければ生成する
        original = token + ".png"
        img = cv2.imread(original)
        write_img_file(img, thumb_file, size)
        #cv2.imwrite(thumb_file, img.resize(size))
    # ファイルを送る
    # app = FastAPI()
    # app.post(thumb_file)
    return FileResponse(thumb_file)


def write_img_file(img, thumb_file, size):
    height, width, colors = img.shape
    # 横に長いときは上下にパディングをして正方形に
    if height < width:
        diff = width - height
        top = math.ceil(diff / 2)
        bottom = diff - top
        img = cv2.copyMakeBorder(
            img, top, bottom, 0, 0, cv2.BORDER_CONSTANT, (0, 0, 0))
    elif height > width:
        img = img[0:width]
    resize_img = cv2.resize(img, dsize=(size, size))
    cv2.imwrite(thumb_file, resize_img)
