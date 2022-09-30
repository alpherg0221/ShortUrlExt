import threading
from random import randint
from queue import Queue
import json
from time import sleep

from google.cloud import firestore

from helper import CONFIG, sha256

firestore.Client(project=CONFIG.firestore.project)


class Cache:
    def __init__(self):
        pass

    @staticmethod
    def load(token):
        db = firestore.Client()
        cache = db.collection("cache").document(token).get()
        if cache.exists:
            return cache.to_dict()
        return None

    @staticmethod
    def store(token, value):
        db = firestore.Client()
        cache_doc = db.collection("cache").document(token)
        cache_doc.set(value)


class Task:
    def __init__(self, worker_id="", task_id=""):
        self.worker_id = worker_id
        self.task_id = task_id
        pass

    def canObtainMutex(self) -> bool:
        db = firestore.Client()
        doc_task = db.collection('tasks').document(self.task_id)
        tx = db.transaction()

        # firestoreのtransactionでmutexを実現する
        @firestore.transactional
        def update_in_transaction(tx, doc_task):
            snapshot = doc_task.get(transaction=tx)
            if snapshot.get("status") != "NEW":
                return False
            tx.update(doc_task, {
                'status': "WORKING",
                'worker': self.worker_id
            })
            return True

        result = update_in_transaction(tx, doc_task)

        return result

    def run(self, params):
        db = firestore.Client()

        col_tasks = db.collection('tasks').where('status', '==', 'DONE')

        task_info = {
            "status": "NEW",
            "params": json.dumps(params)
        }

        cache_token = sha256(json.dumps(task_info))

        cache = Cache.load(cache_token)
        if not cache == None:
            return cache

        _, result = db.collection("tasks").add(task_info)
        task_id = result.id

        callback_done = threading.Event()

        chan = Queue()

        def on_snapshot(col_snapshot, changes, read_time):
            chan.put(col_snapshot)
            callback_done.set()

        self.watch = col_tasks.on_snapshot(on_snapshot)

        while True:
            callback_done.wait()
            col_snapshot = chan.get()
            task = list(filter(lambda e: e.id == task_id, col_snapshot))
            if len(task) == 1:
                result = db.collection("tasks").document(
                    task_id).get().to_dict()
                Cache.store(cache_token, result)
                return result
            sleep(0.5)

    def detail(self):
        db = firestore.Client()
        doc_task = db.collection('tasks').document(self.task_id)
        return doc_task.get().to_dict()

    def done(self, result):
        db = firestore.Client()
        doc_task = db.collection('tasks').document(self.task_id)
        doc_task.update({
            "status": "DONE",
            "result": result
        })

    def failed(self, err_msg):
        db = firestore.Client()
        doc_task = db.collection('tasks').document(self.task_id)
        doc_task.update({
            "status": "DONE",
            "result": json.dumps({"err": err_msg})
        })

    @staticmethod
    def receive() -> str:
        db = firestore.Client()

        col_tasks = db.collection('tasks').where('status', '==', 'NEW')

        callback_done = threading.Event()

        chan = Queue()

        def on_snapshot(col_snapshot, changes, read_time):
            if len(col_snapshot) == 0:
                return
            # ランダムなidを対象とする
            doc_id = col_snapshot[randint(0, 1e9) % len(col_snapshot)].id
            chan.put(doc_id)
            callback_done.set()
            return doc_id

        watch = col_tasks.on_snapshot(on_snapshot)

        callback_done.wait()
        # watch.unsubscribe()

        return chan.get()


class Worker:
    def __init__(self, id):
        self.id = id
        pass

    def attach(self):
        db = firestore.Client()
        doc_worker = db.collection('workers').document(f'{self.id}')
        doc_worker.set({
            "presence": True,
        })

    def detach(self):
        db = firestore.Client()
        doc_worker = db.collection('workers').document(f'{self.id}')

        doc_worker.set({
            "presence": False,
        })
        doc_worker.delete()
