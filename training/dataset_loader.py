import pandas as pd

import os

def load_devign_dataset():
    os.makedirs("training/data", exist_ok=True)
    train_path = "training/data/devign_train.parquet"
    val_path   = "training/data/devign_validation.parquet"
    test_path  = "training/data/devign_test.parquet"

    if os.path.exists(train_path) and os.path.exists(val_path) and os.path.exists(test_path):
        df_train = pd.read_parquet(train_path)
        df_val   = pd.read_parquet(val_path)
        df_test  = pd.read_parquet(test_path)
        return df_train, df_val, df_test

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

    return df_train, df_val, df_test

if __name__ == "__main__":
    df_train, df_val, df_test = load_devign_dataset()
    print(f"Train size: {len(df_train)}, Val size: {len(df_val)}, Test size: {len(df_test)}")
