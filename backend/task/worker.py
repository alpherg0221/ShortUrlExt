
import subprocess
import json

from . import filestore
from .task import Task, Worker
from . import helper


def work(worker_id, doc_id):

    # taskとして細かい部分を隠す
    t = Task(worker_id, doc_id)
    if not t.canObtainMutex():
        return

    # ここから先はmutexによるatmicを期待
    print("working...", doc_id)

    # taskの情報を取得
    task_info = t.detail()

    # taskに引数が指定されていなかったらエラー
    if not "params" in task_info:
        t.failed("no params")
        return

    # taskの引数から重要なものがなくなっていたらエラー
    params = json.loads(task_info["params"])
    if not "url" in params or not "thumbnail" in params:
        t.failed("invalid params")
        return

    # 外部コマンドを実行して出力を得る
    output = subprocess.getoutput(
        f"./taint --url={params['url']} --thumbnail={params['thumbnail']}.png")
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

    # 完了したことを通知
    t.done(output)
    print("done")


if __name__ == "__main__":

    ID = helper.ID()
    print(ID)
    w = Worker(ID)

    try:
        w.attach()
        while True:
            doc_id = Task.receive()
            if len(doc_id) == 0:
                continue
            work(ID, doc_id)

    except Exception as e:
        print(e)
    finally:
        w.detach()
