import torch
import pandas as pd
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel
from torch import nn
from sklearn.metrics import f1_score, roc_auc_score
import json, os

# ── config ──────────────────────────────────────────────
MAX_LEN    = 128    # critical for 6GB VRAM
BATCH_SIZE = 8      # safe for 3050 6GB
EPOCHS     = 5
LR         = 2e-5
MODEL_NAME = "microsoft/codebert-base"
SAVE_PATH  = "outputs/codebert_finetuned.pt"
DEVICE     = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── dataset ─────────────────────────────────────────────
class DevignDataset(Dataset):
    def __init__(self, df, tokenizer):
        self.tokenizer = tokenizer
        self.codes  = df["func"].tolist()
        self.labels = df["target"].tolist()

    def __len__(self):
        return len(self.codes)

    def __getitem__(self, idx):
        enc = self.tokenizer(
            self.codes[idx],
            max_length=MAX_LEN,
            truncation=True,
            padding="max_length",
            return_tensors="pt"
        )
        return {
            "input_ids":      enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "label":          torch.tensor(self.labels[idx], dtype=torch.float)
        }

# ── model ────────────────────────────────────────────────
class CodeBERTClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.bert       = AutoModel.from_pretrained(MODEL_NAME)
        # model.bert.gradient_checkpointing_enable() # uncomment if still OOM
        self.dropout    = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, 1)

    def forward(self, input_ids, attention_mask):
        out = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls = out.last_hidden_state[:, 0, :]   # [CLS] token only
        return self.classifier(self.dropout(cls))

# ── load data ────────────────────────────────────────────
print("Loading dataset...")
os.makedirs("training/data", exist_ok=True)

train_path = "training/data/devign_train.parquet"
val_path   = "training/data/devign_validation.parquet"
test_path  = "training/data/devign_test.parquet"

if os.path.exists(train_path) and os.path.exists(val_path) and os.path.exists(test_path):
    df_train = pd.read_parquet(train_path)
    df_val   = pd.read_parquet(val_path)
    df_test  = pd.read_parquet(test_path)
else:
    print("Downloading from HuggingFace...")
    splits = {
        'train': 'data/train-00000-of-00001-396a063c42dfdb0a.parquet',
        'validation': 'data/validation-00000-of-00001-5d4ba937305086b9.parquet',
        'test': 'data/test-00000-of-00001-e0e162fa10729371.parquet'
    }
    df_train = pd.read_parquet("hf://datasets/DetectVul/devign/" + splits["train"])
    df_val   = pd.read_parquet("hf://datasets/DetectVul/devign/" + splits["validation"])
    df_test  = pd.read_parquet("hf://datasets/DetectVul/devign/" + splits["test"])
    
    df_train.to_parquet(train_path)
    df_val.to_parquet(val_path)
    df_test.to_parquet(test_path)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

train_loader = DataLoader(DevignDataset(df_train, tokenizer),
                          batch_size=BATCH_SIZE, shuffle=True)
val_loader   = DataLoader(DevignDataset(df_val,   tokenizer),
                          batch_size=BATCH_SIZE)
test_loader  = DataLoader(DevignDataset(df_test,  tokenizer),
                          batch_size=BATCH_SIZE)

# ── training ─────────────────────────────────────────────
model     = CodeBERTClassifier().to(DEVICE)
optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)
scheduler = torch.optim.lr_scheduler.LinearLR(
    optimizer, start_factor=0.1, end_factor=1.0, total_iters=3
)  # warmup for first 3 epochs

# compute class weight
num_buggy = df_train["target"].sum()
num_clean = len(df_train) - num_buggy
pos_weight = torch.tensor([(num_clean / num_buggy) ** 0.5]).to(DEVICE)
criterion  = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

best_val_loss = float("inf")
patience_counter = 0
PATIENCE = 3

print(f"Training on {DEVICE} | batch={BATCH_SIZE} | max_len={MAX_LEN}")

for epoch in range(EPOCHS):
    # train
    model.train()
    total_loss = 0
    for batch in train_loader:
        ids  = batch["input_ids"].to(DEVICE)
        mask = batch["attention_mask"].to(DEVICE)
        lbls = batch["label"].to(DEVICE)

        optimizer.zero_grad()
        logits = model(ids, mask).squeeze(1)
        loss   = criterion(logits, lbls)
        loss.backward()

        # gradient clipping — essential for BERT stability
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item()

    scheduler.step()

    # validate
    model.eval()
    val_loss, all_scores, all_labels = 0, [], []
    with torch.no_grad():
        for batch in val_loader:
            ids  = batch["input_ids"].to(DEVICE)
            mask = batch["attention_mask"].to(DEVICE)
            lbls = batch["label"].to(DEVICE)
            logits = model(ids, mask).squeeze(1)
            val_loss += criterion(logits, lbls).item()
            all_scores.extend(torch.sigmoid(logits).cpu().tolist())
            all_labels.extend(lbls.cpu().tolist())

    avg_train = total_loss / len(train_loader)
    avg_val   = val_loss   / len(val_loader)
    val_auc   = roc_auc_score(all_labels, all_scores)
    val_preds = [1 if s >= 0.5 else 0 for s in all_scores]
    val_f1    = f1_score(all_labels, val_preds)

    print(f"Epoch {epoch+1}/{EPOCHS} | "
          f"Train Loss: {avg_train:.4f} | "
          f"Val Loss: {avg_val:.4f} | "
          f"Val AUC: {val_auc:.4f} | "
          f"Val F1: {val_f1:.4f}")

    if avg_val < best_val_loss:
        best_val_loss = avg_val
        patience_counter = 0
        torch.save(model.state_dict(), SAVE_PATH)
        print("  -> Saved best model")
    else:
        patience_counter += 1
        if patience_counter >= PATIENCE:
            print(f"Early stopping at epoch {epoch+1}")
            break

# ── test evaluation ──────────────────────────────────────
print("\nEvaluating on test set...")
model.load_state_dict(torch.load(SAVE_PATH, weights_only=True))
model.eval()

all_scores, all_labels = [], []
with torch.no_grad():
    for batch in test_loader:
        ids  = batch["input_ids"].to(DEVICE)
        mask = batch["attention_mask"].to(DEVICE)
        logits = model(ids, mask).squeeze(1)
        all_scores.extend(torch.sigmoid(logits).cpu().tolist())
        all_labels.extend(batch["label"].tolist())

# optimal threshold
from sklearn.metrics import roc_curve, confusion_matrix, accuracy_score
fpr, tpr, thresholds = roc_curve(all_labels, all_scores)
optimal_threshold = float(thresholds[(tpr - fpr).argmax()])
y_pred = [1 if s >= optimal_threshold else 0 for s in all_scores]

results = {
    "model": "codebert-finetuned",
    "accuracy":          accuracy_score(all_labels, y_pred),
    "f1_score":          f1_score(all_labels, y_pred),
    "auc_roc":           roc_auc_score(all_labels, all_scores),
    "optimal_threshold": optimal_threshold,
    "confusion_matrix":  confusion_matrix(all_labels, y_pred).tolist()
}

print(json.dumps(results, indent=4))
with open("outputs/codebert_metrics.json", "w") as f:
    json.dump(results, f, indent=4)
