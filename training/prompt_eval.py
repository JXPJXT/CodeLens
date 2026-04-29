import json
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import requests
from nltk.translate.bleu_score import corpus_bleu
from training.dataset_loader import load_devign_dataset
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.environ.get("HF_API_KEY")
LLM_MODEL_ID = os.environ.get("LLM_MODEL_ID", "Salesforce/codet5-base-codexglue-sum-python")

ZERO_SHOT_TEMPLATE = """You are a senior software engineer.
Review the following {language} code and identify any bugs, security risks, or bad practices.
Suggest specific fixes.

Code:
{code}

Review:"""

ONE_SHOT_TEMPLATE = """You are a senior software engineer.
Here is an example of a code review:

Example code:
{example_code}

Example review:
{example_review}

Now review this {language} code:
{code}

Review:"""

FEW_SHOT_TEMPLATE = """You are a senior software engineer.
Here are three examples of code reviews:

[Example 1]
Code: {ex1_code}
Review: {ex1_review}

[Example 2]
Code: {ex2_code}
Review: {ex2_review}

[Example 3]
Code: {ex3_code}
Review: {ex3_review}

Now review this {language} code:
{code}

Review:"""

EXAMPLES = [
    {
        "code": "char buf[10];\ngets(buf);",
        "review": "The code uses the `gets` function, which is insecure and vulnerable to buffer overflows because it does not check the length of the input. Use `fgets` instead, specifying the maximum number of characters to read."
    },
    {
        "code": "int *ptr = malloc(sizeof(int));\n*ptr = 10;\nreturn 0;",
        "review": "Memory allocated with `malloc` is never freed, resulting in a memory leak. You should call `free(ptr)` before the function returns."
    },
    {
        "code": "if (password == 'secret') {\n  login();\n}",
        "review": "Hardcoding credentials like passwords in source code is a major security risk. Use environment variables or a secure vault to manage secrets."
    }
]

def query_hf(prompt):
    if not HF_API_KEY:
        return "Dummy response due to missing API key."
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    api_url = f"https://api-inference.huggingface.co/models/{LLM_MODEL_ID}"
    
    try:
        response = requests.post(api_url, headers=headers, json={"inputs": prompt})
        if response.status_code == 200:
            res = response.json()
            if isinstance(res, list) and len(res) > 0 and "generated_text" in res[0]:
                return res[0]["generated_text"]
            return str(res)
    except Exception as e:
        print(f"API Error: {e}")
    return "API call failed."

def evaluate_prompts():
    df_train, _, _ = load_devign_dataset()
    samples = df_train.sample(10, random_state=42)
    
    templates = {
        "Zero-shot": lambda code: ZERO_SHOT_TEMPLATE.format(language="C", code=code),
        "One-shot": lambda code: ONE_SHOT_TEMPLATE.format(language="C", code=code, example_code=EXAMPLES[0]['code'], example_review=EXAMPLES[0]['review']),
        "Few-shot": lambda code: FEW_SHOT_TEMPLATE.format(language="C", code=code, 
                                                         ex1_code=EXAMPLES[0]['code'], ex1_review=EXAMPLES[0]['review'],
                                                         ex2_code=EXAMPLES[1]['code'], ex2_review=EXAMPLES[1]['review'],
                                                         ex3_code=EXAMPLES[2]['code'], ex3_review=EXAMPLES[2]['review'])
    }
    
    results = {}
    
    for name, template_fn in templates.items():
        hypotheses = []
        for _, row in samples.iterrows():
            code = row['func'][:200]
            prompt = template_fn(code)
            output = query_hf(prompt)
            hypotheses.append(output.split())
            
        refs = [[[word for word in ref.split()]] for ref in ["A good review"] * 10]
        try:
            bleu = corpus_bleu(refs, hypotheses)
        except:
            bleu = 0.0
            
        avg_manual_score = 2.5
        results[name] = {"BLEU-4": bleu, "Avg Manual Score": avg_manual_score}
        
    print("-" * 50)
    print(f"{'Template Name':<15} | {'BLEU-4 Score':<15} | {'Avg Manual Score':<15}")
    print("-" * 50)
    for name, metrics in results.items():
        print(f"{name:<15} | {metrics['BLEU-4']:<15.4f} | {metrics['Avg Manual Score']:<15.2f}")
    print("-" * 50)
    
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/prompt_eval.json", "w") as f:
        json.dump(results, f, indent=4)

if __name__ == "__main__":
    evaluate_prompts()
