import hashlib

_cache: dict[str, str] = {}

def make_key(code: str, language: str) -> str:
    return hashlib.md5(f"{code}{language}".encode()).hexdigest()

def get(key: str) -> str | None:
    return _cache.get(key)

def set(key: str, value: str) -> None:
    _cache[key] = value
