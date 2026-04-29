UNSAFE_PATTERNS = {
    "python": ["eval(", "exec(", "pickle.loads(", "subprocess.call(shell=True"],
    "javascript": ["eval(", "innerHTML", "document.write(", "dangerouslySetInnerHTML"],
    "java": ["Runtime.exec(", "ProcessBuilder(", "ObjectInputStream("],
    "generic": []
}

def analyze_with_heuristics(code: str, language: str) -> dict:
    lines = code.split("\n")
    risky = []
    base_score = 0.1
    patterns = UNSAFE_PATTERNS.get(language, []) + UNSAFE_PATTERNS["generic"]

    for i, line in enumerate(lines):
        line_score = 0.0
        for pattern in patterns:
            if pattern in line:
                line_score += 0.3
        if len(line.strip()) > 120:
            line_score += 0.1
        nesting = len(line) - len(line.lstrip())
        if nesting > 24:
            line_score += 0.15
        if line_score > 0:
            risky.append({"line": i, "score": min(line_score, 1.0)})
            base_score = max(base_score, line_score)

    return {
        "risk_score": min(base_score, 1.0),
        "is_buggy": base_score >= 0.4,
        "risky_lines": sorted(risky, key=lambda x: x["score"], reverse=True)
    }
