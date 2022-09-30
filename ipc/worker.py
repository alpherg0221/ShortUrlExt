
import atexit
import datetime
from random import randint
import threading
from time import sleep
import hashlib
import subprocess
import json

from google.cloud import firestore
from google.cloud import storage

ID = None


def issue_id():
    global ID
    ID = hashlib.md5(f'{datetime.datetime.now()}'.encode()).hexdigest()[:10]


def exit_handler():

    db = firestore.Client()
    doc_worker = db.collection('workers').document(f'{ID}')

    doc_worker.set({
        "presence": False,
    })
    doc_worker.delete()


def init():
    issue_id()
    firestore.Client(project='mws2022-364010')
    storage.Client(project='mws2022-364010')

def work(doc_id):
    db = firestore.Client()
    doc_task = db.collection('tasks').document(doc_id)
    tx = db.transaction()

    # firestoreのtransactionでmutexを実現する
    @firestore.transactional
    def update_in_transaction(tx, doc_task):
        snapshot = doc_task.get(transaction=tx)
        if snapshot.get("status") != "NEW":
            return False
        tx.update(doc_task, {
            'status': "WORKING",
            'worker': ID
        })
        return True

    result = update_in_transaction(tx, doc_task)

    if not result:
        return

    # ここから先はmutexによるatmicを期待

    print("working...", doc_id)

    task = doc_task.get().to_dict()

    def failed(err_msg):
        doc_task.update({
            "status": "DONE",
            "result": json.dumps({"err": err_msg})
        })
    if not "params" in task:
        failed("no params")
        return

    params = json.loads(task["params"])

    if not "url" in params or not "thumbnail" in params:
        failed("invalid params")
        return

    output = subprocess.getoutput(
        f"./taint --url={params['url']} --thumbnail={params['thumbnail']}.png")

    result = None
    try:
        result = json.loads(output)
    except:
        print(output)
        failed("internal error")
        return

    if "thumbnail" in result:
        fs = storage.Client()
        bucket = fs.bucket('mws2022-thumbnail')
        blob = bucket.blob(result["thumbnail"])
        blob.upload_from_filename(result["thumbnail"])

    doc_task.update({
        "status": "DONE",
        "result": output
    })
    print("done")


def main():
    print(ID)
    db = firestore.Client()
    doc_worker = db.collection('workers').document(f'{ID}')
    doc_worker.set({
        "presence": True,
    })

    col_tasks = db.collection('tasks').where('status', '==', 'NEW')

    callback_done = threading.Event()

    def on_snapshot(col_snapshot, changes, read_time):
        if len(col_snapshot) == 0:
            return
        # ランダムなidを対象とする
        doc_id = col_snapshot[randint(0, 1e9) % len(col_snapshot)].id
        work(doc_id)
        callback_done.set()

    watch = col_tasks.on_snapshot(on_snapshot)

    while True:

        callback_done.wait()

        sleep(1)

    return watch


if __name__ == "__main__":
    watch = None
    try:
        init()
        watch = main()
    except Exception as e:
        print(e)
    finally:
        exit_handler()
        if not watch is None:
            watch.unsubscribe()
