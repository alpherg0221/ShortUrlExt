from google.cloud import storage

from helper import CONFIG

storage.Client(project=CONFIG.storage.project)

def push(filename):
    fs = storage.Client()
    bucket = fs.bucket(CONFIG.storage.bucket)
    blob = bucket.blob(filename)
    blob.upload_from_filename(filename)

def pull(filename):
    fs = storage.Client()
    bucket = fs.bucket(CONFIG.storage.bucket)
    blob = bucket.blob(filename)
    blob.download_to_filename(filename)