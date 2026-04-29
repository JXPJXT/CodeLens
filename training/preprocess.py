import json
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import torch
from torch.utils.data import TensorDataset, DataLoader
from transformers import AutoTokenizer
from training.dataset_loader import load_devign_dataset

MAX_CODE_LENGTH = 256

def get_tokenizer():
    tokenizer = AutoTokenizer.from_pretrained("outputs/codebert_tokenizer/")
    return tokenizer

def create_dataset(df, tokenizer):
    funcs = df['func'].tolist()
    targets = df['target'].tolist()
    
    tokens = tokenizer(funcs, truncation=True, max_length=MAX_CODE_LENGTH, padding='max_length', return_tensors='pt')
    
    dataset = TensorDataset(tokens['input_ids'], torch.tensor(targets, dtype=torch.float32))
    return dataset

def get_dataloaders(batch_size=64):
    df_train, df_val, df_test = load_devign_dataset()
    tokenizer = get_tokenizer()
    
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/tokenizer_vocab.json", "w") as f:
        json.dump(tokenizer.get_vocab(), f)
    
    train_ds = create_dataset(df_train, tokenizer)
    val_ds = create_dataset(df_val, tokenizer)
    test_ds = create_dataset(df_test, tokenizer)
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader, len(tokenizer)

if __name__ == "__main__":
    get_dataloaders()
