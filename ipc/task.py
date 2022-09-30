import threading
from random import randint
from queue import Queue

from google.cloud import firestore

from helper import CONFIG

firestore.Client(project=CONFIG.firestore.project)


class Task:
    def __init__(self, worker_id, task_id):
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
        print(result)

        return result

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
