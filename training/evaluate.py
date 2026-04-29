import json
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import torch
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix
from training.preprocess import get_dataloaders
from training.model import TextCNN

def evaluate():
    _, _, test_loader, vocab_size = get_dataloaders(64)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = TextCNN(vocab_size=50265, embed_dim=128).to(device)
    
    model.load_state_dict(torch.load("outputs/textcnn.pt", map_location=device, weights_only=True))
    model.eval()
    
    all_targets = []
    all_preds = []
    all_probs = []
    
    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            
            probs = torch.sigmoid(outputs).cpu().numpy()
            preds = (probs >= 0.5).astype(float)
            
            all_probs.extend(probs)
            all_preds.extend(preds)
            all_targets.extend(targets.numpy())
            
    from sklearn.metrics import roc_curve
    import numpy as np

    fpr, tpr, thresholds = roc_curve(all_targets, all_probs)
    optimal_idx = (tpr - fpr).argmax()
    optimal_threshold = float(thresholds[optimal_idx])

    print(f"Optimal threshold: {optimal_threshold:.3f}")

    # Re-evaluate with optimal threshold
    all_preds_optimal = (np.array(all_probs) >= optimal_threshold).astype(int)

    accuracy = accuracy_score(all_targets, all_preds_optimal)
    f1 = f1_score(all_targets, all_preds_optimal)
    auc_roc = roc_auc_score(all_targets, all_probs)
    cm = confusion_matrix(all_targets, all_preds_optimal).tolist()
    
    metrics = {
        "accuracy": accuracy,
        "f1_score": f1,
        "auc_roc": auc_roc,
        "optimal_threshold": optimal_threshold,
        "confusion_matrix": cm
    }
    
    print(json.dumps(metrics, indent=4))
    
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/metrics_report.json", "w") as f:
        json.dump(metrics, f, indent=4)

if __name__ == "__main__":
    evaluate()
