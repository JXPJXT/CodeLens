import torch
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import colorama
from colorama import Fore, Style
from transformers import GPT2Tokenizer
from training.model import TextCNN
import json

colorama.init()

MAX_CODE_LENGTH = 512

class Explainer:
    def __init__(self, model_path="outputs/textcnn.pt", vocab_path="outputs/tokenizer_vocab.json"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        self.tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        try:
            with open(vocab_path, "r") as f:
                vocab = json.load(f)
            vocab_size = len(vocab)
        except FileNotFoundError:
            vocab_size = self.tokenizer.vocab_size
            
        self.model = TextCNN(vocab_size=vocab_size, embed_dim=128).to(self.device)
        try:
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        except FileNotFoundError:
            pass
        self.model.eval()

    def explain(self, code: str):
        lines = code.split('\n')
        
        tokens = self.tokenizer(code, truncation=True, max_length=MAX_CODE_LENGTH)
        input_ids = torch.tensor([tokens['input_ids']]).to(self.device)
        
        with torch.no_grad():
            act_a, act_b, act_c = self.model.get_activations(input_ids)
            
            max_a, _ = torch.max(act_a, dim=1)
            max_b, _ = torch.max(act_b, dim=1)
            max_c, _ = torch.max(act_c, dim=1)
            
            token_risks = (max_a + max_b + max_c).squeeze(0).cpu().numpy()
            
        line_scores = {i: 0.0 for i in range(len(lines))}
        
        current_line = 0
        for token_idx, t_id in enumerate(tokens['input_ids']):
            if token_idx >= len(token_risks):
                break
            
            token_str = self.tokenizer.decode([t_id])
            newlines = token_str.count('\n')
            
            line_scores[current_line] = max(line_scores.get(current_line, 0.0), token_risks[token_idx].item())
            
            if newlines > 0:
                current_line += newlines
                if current_line >= len(lines):
                    current_line = len(lines) - 1
                
        max_score = max(line_scores.values()) if line_scores.values() else 1.0
        if max_score > 0:
            for k in line_scores:
                line_scores[k] /= max_score
                
        risky_lines = [{"line": i, "score": score} for i, score in line_scores.items() if score > 0.0]
        risky_lines.sort(key=lambda x: x["score"], reverse=True)
        
        return risky_lines

def visualize_heatmap(code: str, risky_lines: list):
    lines = code.split('\n')
    score_map = {item['line']: item['score'] for item in risky_lines}
    
    for i, line in enumerate(lines):
        score = score_map.get(i, 0.0)
        if score > 0.7:
            color = Fore.RED
        elif score > 0.3:
            color = Fore.YELLOW
        else:
            color = Style.RESET_ALL
            
        print(f"{color}{i+1:4d} | {score:.2f} | {line}{Style.RESET_ALL}")

if __name__ == "__main__":
    sample_code = "int main() {\n  char buf[10];\n  gets(buf);\n  return 0;\n}"
    explainer = Explainer()
    risks = explainer.explain(sample_code)
    visualize_heatmap(sample_code, risks)
