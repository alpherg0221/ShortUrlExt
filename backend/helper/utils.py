import hashlib
import re


def sha256(url):
    return hashlib.sha256(url.encode()).hexdigest()


def is_url(url):
    # https://uibakery.io/regex-library/url-regex-python
    url_pattern = "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$"
    return re.match(url_pattern, url) != None


def format_json(token, src):
    if not ("from_url" in src and "term_url" in src and "chains" in src and "info" in src):
        return {"err": "internal server error"}
    return {
        "from_url": src["from_url"],
        "term_url": src["term_url"],
        "chains": src["chains"],
        "thumbnail": token,
        "info": src["info"]
    }


def remove_empty(obj: dict):
    dels = []
    for key in obj.keys():
        if obj[key] == "":
            dels.append(key)
    for d in dels:
        del obj[d]
    return obj
