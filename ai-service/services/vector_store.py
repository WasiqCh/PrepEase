from typing import List, Dict, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer

from services.text_chunker import TextChunker


class VectorStore:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.storage: Dict[str, Dict] = {}
        self.chunker = TextChunker(chunk_size=500, overlap=50)

    def ingest(self, material_id: str, text: str) -> None:
        """
        Chunk text, generate embeddings, and store in memory.
        """
        chunks = self.chunker.chunk_text(text)
        
        if not chunks:
            raise ValueError("No valid text chunks generated")

        embeddings = self.model.encode(chunks, convert_to_numpy=True)

        self.storage[material_id] = {
            "chunks": chunks,
            "embeddings": embeddings,
            "full_text": text
        }

    def retrieve(self, material_id: str, query: str, top_k: int = 3) -> List[str]:
        """
        Retrieve most relevant chunks for a query using cosine similarity.
        """
        if material_id not in self.storage:
            raise ValueError(f"Material {material_id} not found")

        data = self.storage[material_id]
        query_embedding = self.model.encode([query], convert_to_numpy=True)[0]

        similarities = self._cosine_similarity(query_embedding, data["embeddings"])
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        return [data["chunks"][i] for i in top_indices]

    def get_all_chunks(self, material_id: str) -> List[str]:
        """
        Get all chunks for a material (used for quiz generation).
        """
        if material_id not in self.storage:
            raise ValueError(f"Material {material_id} not found")
        
        return self.storage[material_id]["chunks"]

    def _cosine_similarity(self, query_vec: np.ndarray, embeddings: np.ndarray) -> np.ndarray:
        """
        Calculate cosine similarity between query and all embeddings.
        """
        query_norm = query_vec / np.linalg.norm(query_vec)
        embeddings_norm = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        return np.dot(embeddings_norm, query_norm)

    def material_exists(self, material_id: str) -> bool:
        return material_id in self.storage
