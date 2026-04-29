import requests
import logging
from config import settings
from shared.prompts import EXAMPLES
from services import cache

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def get_review_from_llm(code: str, language: str, risk_score: float = 0.5) -> dict:
    key = cache.make_key(code, language)
    if settings.cache_enabled:
        cached_val = cache.get(key)
        if cached_val:
            return {"comment": cached_val, "prompt_type": "few_shot", "cached": True}

    # Build a few-shot prompt from the examples
    examples_text = ""
    for i, ex in enumerate(EXAMPLES, 1):
        examples_text += f"[Example {i}]\nCode: {ex['code']}\nReview: {ex['review']}\n\n"

    user_prompt = f"""{examples_text}Now review this {language} code and identify any bugs, security risks, or bad practices. Be concise and actionable.

Code:
{code}

Review:"""
    
    try:
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.llm_model_id,
            "messages": [
                {"role": "system", "content": "You are an expert code reviewer. Analyze the code for bugs, vulnerabilities, and quality issues. Be concise and actionable."},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 512
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=15)
        
        if response.status_code == 200:
            res = response.json()
            comment = res["choices"][0]["message"]["content"]
                
            if settings.cache_enabled:
                cache.set(key, comment)
                
            return {"comment": comment, "prompt_type": "few_shot", "cached": False}
        else:
            logger.warning(f"Groq API returned status code {response.status_code}: {response.text}")
            
    except Exception as e:
        logger.warning(f"LLM service call failed: {e}")

    fallback = f"LLM service unavailable. CNN detected risk score: {risk_score:.2f}. Please review manually."
    return {"comment": fallback, "prompt_type": "few_shot", "cached": False}
