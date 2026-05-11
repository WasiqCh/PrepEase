from typing import List


class TextChunker:
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks for better context preservation.
        """
        if not text or not text.strip():
            return []

        text = text.strip()
        words = text.split()
        
        if len(words) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(words):
            end = start + self.chunk_size
            chunk_words = words[start:end]
            chunks.append(' '.join(chunk_words))
            
            if end >= len(words):
                break
            
            start = end - self.overlap

        return chunks
