import torch
import torch.nn as nn

class TextCNN(nn.Module):
    def __init__(self, vocab_size=50257, embed_dim=128, num_filters=100):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, num_filters, k) for k in [3, 4, 5]
        ])
        self.bn = nn.BatchNorm1d(num_filters * 3)
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(num_filters * 3, 1)

    def forward(self, x):
        x = self.embedding(x)
        x = x.permute(0, 2, 1)
        x = [torch.relu(conv(x)) for conv in self.convs]
        x = [torch.max(f, dim=2)[0] for f in x]
        x = torch.cat(x, dim=1)
        x = self.bn(x)
        x = self.dropout(x)
        return self.fc(x).squeeze(1)

    def get_activations(self, x):
        x = self.embedding(x).permute(0, 2, 1)
        return [conv(x) for conv in self.convs]
