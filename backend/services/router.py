from services.cnn_service import analyze_with_cnn
from services.analyzer import analyze_with_heuristics
from utils.language import detect_language

def route_analysis(code: str, language: str) -> dict:
    lang = language.lower().strip()
    if lang in ["c", "cpp", "c++"]:
        result = analyze_with_cnn(code)
        result["mode"] = "cnn"
    else:
        result = analyze_with_heuristics(code, lang)
        result["mode"] = "heuristic"
    return result
