
import atexit
import datetime
from random import randint
import threading

import hashlib
import json

from google.cloud import firestore

from . import filestore
from .helper import random_str
from .task import Task


class Dispatcher:

    def clean(self):
        db = firestore.Client()
        query = db.collection("tasks").where("status", "==", "DONE")
        dones = query.get()
        for d in dones:
            ref = db.collection("tasks").document(d.id)
            ref.delete()


if __name__ == "__main__":
    t = Task()

    completed = t.run({"url": "http://google.com",
                       "thumbnail": random_str()})
    result = json.loads(completed["result"])
    if "thumbnail" in result:
        filestore.pull(result["thumbnail"])
    print(completed["result"])

    # distatcher.close()
