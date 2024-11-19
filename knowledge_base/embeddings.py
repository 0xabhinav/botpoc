from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import torch

class EmbeddingEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.dimension = 384  # Default dimension for this model
        self.index = faiss.IndexFlatL2(self.dimension)
        
    def generate_embedding(self, text: str) -> np.ndarray:
        with torch.no_grad():
            return self.model.encode(text)
            
    def add_to_index(self, embedding: np.ndarray):
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        self.index.add(embedding.astype('float32'))
        
    def search(self, query_embedding: np.ndarray, k: int = 5) -> tuple[np.ndarray, np.ndarray]:
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)
        return self.index.search(query_embedding.astype('float32'), k)
