
class Cache:
    def __init__(self):
        self.db = {}

    def store(self, key, value):
        self.db[f"{key}"] = value

    def exists(self, key):
        return f"{key}" in self.db

    def clear(self, key):
        del self.db[f"{key}"]

    def load(self, key):
        return self.db[f"{key}"]


DetailCache = Cache()
