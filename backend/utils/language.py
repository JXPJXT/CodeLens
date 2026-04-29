EXTENSION_MAP = {
    ".c": "c", ".h": "c",
    ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp",
    ".py": "python",
    ".js": "javascript", ".ts": "javascript",
    ".java": "java",
}

def detect_language(filename: str) -> str:
    for ext, lang in EXTENSION_MAP.items():
        if filename.endswith(ext):
            return lang
    return "unknown"
