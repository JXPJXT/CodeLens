import sys
import os

# Add parent directory to sys.path to allow importing from training
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import torch
import json
import logging
from transformers import AutoTokenizer
from training.model import TextCNN
from config import settings

logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))

# Load model once at import time
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer_path = os.path.join(PROJECT_ROOT, "training/outputs/codebert_tokenizer/")

try:
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
    vocab_size = len(tokenizer)
except Exception as e:
    logger.warning(f"Could not load tokenizer: {e}")
    tokenizer = None
    vocab_size = 0

model = None

try:
    with open(os.path.join(PROJECT_ROOT, settings.vocab_path), "r") as f:
        vocab = json.load(f)
        vocab_size = len(vocab)
except Exception as e:
    logger.warning(f"Could not load vocab from {settings.vocab_path}: {e}")

try:
    # Initialize the simpler baseline TextCNN without pretrained CodeBERT embeddings
    model = TextCNN(vocab_size=50265, embed_dim=128).to(device)
    model.load_state_dict(torch.load(os.path.join(PROJECT_ROOT, settings.cnn_model_path), map_location=device, weights_only=True))
    model.eval()
    logger.info("CNN Model loaded successfully.")
except Exception as e:
    logger.warning(f"CNN Model missing or failed to load: {e}")
    model = None

def analyze_with_cnn(code: str) -> dict:
    if model is None or tokenizer is None:
        logger.warning("analyze_with_cnn called but model or tokenizer is missing")
        return {"risk_score": 0.5, "is_buggy": False, "risky_lines": [], "mode": "cnn_unavailable"}

    lines = code.split('\n')
    tokens = tokenizer(code, truncation=True, padding='max_length', max_length=settings.max_code_length, return_tensors='pt')
    input_ids = tokens['input_ids'].to(device)

    with torch.no_grad():
        risk_score_tensor = model(input_ids)
        risk_score = torch.sigmoid(risk_score_tensor).item()
        
        activations = model.get_activations(input_ids)
        seq_len = input_ids.size(1)
        
        # Each conv produces a different length output due to kernel size.
        # Max-pool across filters, then interpolate back to seq_len so they align.
        aligned = []
        for act in activations:
            pooled, _ = torch.max(act, dim=1)                          # (batch, reduced_seq)
            interp = torch.nn.functional.interpolate(
                pooled.unsqueeze(1), size=seq_len, mode='linear', align_corners=False
            ).squeeze(1)                                               # (batch, seq_len)
            aligned.append(interp)
        
        token_risks = torch.stack(aligned).mean(dim=0).squeeze(0).cpu().numpy()

    line_scores = {i: 0.0 for i in range(len(lines))}
    current_line = 0
    
    for token_idx, t_id in enumerate(tokens['input_ids'][0]):
        if token_idx >= len(token_risks):
            break
            
        token_str = tokenizer.decode([t_id])
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

    return {
        "risk_score": risk_score,
        "is_buggy": risk_score >= settings.risk_threshold,
        "risky_lines": risky_lines
    }
