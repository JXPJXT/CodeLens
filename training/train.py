import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import torch
import torch.nn as nn
import torch.optim as optim
from torch.nn import BCEWithLogitsLoss
from torch.optim.lr_scheduler import ReduceLROnPlateau
from training.preprocess import get_dataloaders
from training.model import TextCNN

EPOCHS = 10
BATCH_SIZE = 64
LR = 1e-3

def train():
    print("Preparing dataloaders...")
    train_loader, val_loader, _, vocab_size = get_dataloaders(BATCH_SIZE)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = TextCNN(vocab_size=50265, embed_dim=128).to(device)
    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion = BCEWithLogitsLoss()
    
    # We still keep a simple scheduler if there was one, or remove it?
    # Let's remove scheduler from optimizer if it was not in the clean baseline
    # The prompt says: no CodeBERT embeddings, no projection, no weighted loss, no differential LR
    # We'll just set up patience and best_val_loss for early stopping
    
    best_val_loss = float('inf')
    patience = 3
    patience_counter = 0
    os.makedirs("outputs", exist_ok=True)
    
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0
        
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * inputs.size(0)
            
        train_loss /= len(train_loader.dataset)
        
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * inputs.size(0)
                
                probs = torch.sigmoid(outputs)
                preds = (probs >= 0.5).float()
                correct += (preds == targets).sum().item()
                total += targets.size(0)
                
        val_loss /= len(val_loader.dataset)
        val_acc = correct / total
        
        
        print(f"Epoch {epoch+1}/{EPOCHS} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), "outputs/textcnn.pt")
            print("  -> Saved best model")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch+1}")
                break

if __name__ == "__main__":
    train()
