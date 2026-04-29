import json
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import re
from transformers import GPT2Tokenizer
from training.dataset_loader import load_devign_dataset

"""
Insight:
BPE tokenization handles code identifiers (like `getUserData`) significantly better than whitespace splitting.
Whitespace tokenization treats `getUserData` as a single out-of-vocabulary word if not seen before.
BPE breaks it down into subwords like `get`, `User`, `Data`, which helps the model generalize across
different camelCase or snake_case conventions and share semantic meaning among similar identifier roots.
"""

def compute_metrics(code_list, tokenizer):
    total_bpe_tokens = 0
    total_words = 0
    unique_bpe = set()
    
    for code in code_list:
        words = code.split()
        bpe_tokens = tokenizer.tokenize(code)
        
        total_words += len(words)
        total_bpe_tokens += len(bpe_tokens)
        unique_bpe.update(bpe_tokens)
        
    fertility = total_bpe_tokens / total_words if total_words > 0 else 0
    coverage = len(unique_bpe) / total_bpe_tokens if total_bpe_tokens > 0 else 0
    
    return fertility, coverage

def nlp_analysis():
    print("Loading devign dataset...")
    df_train, _, _ = load_devign_dataset()
    sample_c = df_train.sample(50, random_state=42)['func'].tolist()
    
    sample_python = [
        "def hello_world():\n    print('Hello world!')",
        "class MyClass:\n    def __init__(self, x):\n        self.x = x",
        "import os\nfor f in os.listdir('.'):\n    print(f)",
        "def fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)",
        "import requests\nr = requests.get('http://example.com')\nprint(r.status_code)"
    ] * 10
    
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    
    c_fertility, c_coverage = compute_metrics(sample_c, tokenizer)
    py_fertility, py_coverage = compute_metrics(sample_python, tokenizer)
    
    print("-" * 50)
    print("NLP Analysis: BPE vs Word Tokenization")
    print("-" * 50)
    print(f"{'Language':<10} | {'Fertility':<10} | {'Coverage':<10}")
    print("-" * 50)
    print(f"{'C':<10} | {c_fertility:<10.2f} | {c_coverage:<10.4f}")
    print(f"{'Python':<10} | {py_fertility:<10.2f} | {py_coverage:<10.4f}")
    print("-" * 50)
    
    results = {
        "c_fertility": c_fertility,
        "c_coverage": c_coverage,
        "py_fertility": py_fertility,
        "py_coverage": py_coverage
    }
    
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/nlp_analysis.json", "w") as f:
        json.dump(results, f, indent=4)

if __name__ == "__main__":
    nlp_analysis()
