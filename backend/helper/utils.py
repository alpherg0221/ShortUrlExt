import hashlib
import re

def sha256(url):
    return hashlib.sha256(url.encode()).hexdigest()


def is_url(url):
    # https://uibakery.io/regex-library/url-regex-python
    url_pattern = "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$"
    return re.match(url_pattern, url) != None


def format_json(token, src):
    if not ("src" in src and "dst" in src and "chain" in src and "info" in src):
        return {"err": "internal server error"}
    return {
        "from_url": src["src"],
        "term_url": src["dst"],
        "chains": src["chain"],
        "thumbnail": token,
        "info": src["info"]
    }
