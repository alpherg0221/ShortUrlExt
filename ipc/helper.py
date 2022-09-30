
from dataclasses import dataclass
import hashlib
import datetime

@dataclass
class firestore:
    project: str


@dataclass
class storage:
    project: str
    bucket: str


@dataclass
class config:
    firestore: firestore
    storage: storage


CONFIG = config(**{
    "firestore": firestore(**{
        "project": "mws2022-364010"
    }),
    "storage": storage(**{
        "project": "mws2022-364010",
        "bucket": 'mws2022-thumbnail'
    })
})


def ID():
    import os
    return f"{os.uname()[1]}-{random_str()}"


def random_str():
    return hashlib.sha256(f'{datetime.datetime.now()}'.encode()).hexdigest()[:10]
