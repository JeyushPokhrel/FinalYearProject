import os
import psutil
import time

def get_memory_usage():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024  # in MB

print(f"Initial memory usage: {get_memory_usage():.2f} MB")

import torch
torch.set_num_threads(1)
print(f"After importing torch and setting threads: {get_memory_usage():.2f} MB")

from sentence_transformers import SentenceTransformer
print(f"After importing SentenceTransformer: {get_memory_usage():.2f} MB")

model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
print(f"After loading model: {get_memory_usage():.2f} MB")

import numpy as np
doc_embeddings = np.load("embeddings.npy")
print(f"After loading embeddings: {get_memory_usage():.2f} MB")
