
import atexit
import datetime
from random import randint
import threading
from time import sleep
import hashlib
import json

from google.cloud import firestore
from google.cloud import storage


class Dispatcher:
    def __init__(self):
        db = firestore.Client(project='mws2022-364010')
        storage.Client(project='mws2022-364010')

        col_tasks = db.collection('tasks').where('status', '==', 'DONE')
        self.event = threading.Event()

        def on_snapshot(col_snapshot, changes, read_time):
            self.col_snapshot = col_snapshot
            self.event.set()

        self.watch = col_tasks.on_snapshot(on_snapshot)

    def register(self, params):
        db = firestore.Client()
        self.params = json.dumps(params)
        record = {
            "status": "NEW",
            "params": self.params
        }
        self.cache_token = hashlib.sha256(
            json.dumps(record).encode()).digest().hex()
        self.cache = self.load_cache(self.cache_token)
        if self.cache == None:
            ts, result = db.collection("tasks").add(record)
            self.task = result.id

    def complete(self):
        if self.cache != None:
            return self.cache

        db = firestore.Client()
        while True:
            self.event.wait()
            task = list(filter(lambda e: e.id == self.task, self.col_snapshot))
            if len(task) == 1:
                result = db.collection("tasks").document(
                    self.task).get().to_dict()
                self.store_cache(self.cache_token, result)

    def download_thumbnail(self, filename):
        fs = storage.Client()
        bucket = fs.bucket("mws2022-thumbnail")
        blob = bucket.blob(filename)
        blob.download_to_filename(filename)

    def store_cache(self, token, result):
        db = firestore.Client()
        cache_doc = db.collection("cache").document(token)
        cache_doc.set(result)

    def load_cache(self, token):
        db = firestore.Client()
        cache = db.collection("cache").document(token).get()
        if cache.exists:
            return cache.to_dict()
        return None

    def clean(self):
        db = firestore.Client()
        query = db.collection("tasks").where("status", "==", "DONE")
        dones = query.get()
        for d in dones:
            ref = db.collection("tasks").document(d.id)
            ref.delete()

    def close(self):
        self.watch.unsubscribe()


if __name__ == "__main__":
    distatcher = Dispatcher()

    distatcher.register({"url": "http://google.com", "thumbnail": "test"})
    completed = distatcher.complete()
    result = json.loads(completed["result"])
    if "thumbnail" in result:
        distatcher.download_thumbnail(result["thumbnail"])
    print(completed["result"])

    # distatcher.close()
