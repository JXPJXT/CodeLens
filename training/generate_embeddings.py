import torch
from transformers import AutoTokenizer, AutoModel
import json

print("Loading CodeBERT...")
tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
model = AutoModel.from_pretrained("microsoft/codebert-base")
model.eval()

# Extract the embedding weight matrix (vocab_size=50265, dim=768)
embedding_weights = model.embeddings.word_embeddings.weight.detach()

# Save it
import os
os.makedirs("outputs", exist_ok=True)
torch.save(embedding_weights, "outputs/codebert_embeddings.pt")

# Save tokenizer vocab
tokenizer.save_pretrained("outputs/codebert_tokenizer/")

print(f"Saved embedding matrix: {embedding_weights.shape}")
