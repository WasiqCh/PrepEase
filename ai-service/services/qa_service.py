import re
from typing import List


class QAService:
    def __init__(self, vector_store):
        self.vector_store = vector_store

    def answer_question(self, material_id: str, question: str) -> str:
        """
        Answer a question based on retrieved context from the material.
        Responses are grounded only in provided content.
        """
        if not self.vector_store.material_exists(material_id):
            raise ValueError(f"Material {material_id} not found")

        relevant_chunks = self.vector_store.retrieve(material_id, question, top_k=3)

        answer = self._generate_answer(question, relevant_chunks)
        
        return answer

    def _generate_answer(self, question: str, context_chunks: List[str]) -> str:
        """
        Generate answer from context chunks using rule-based extraction.
        Falls back to stating information is not available if no match found.
        """
        context = " ".join(context_chunks)
        
        if not self._is_relevant_context(question, context):
            return "This information is not available in the provided material."

        answer = self._extract_answer_from_context(question, context)
        
        if not answer:
            return "This information is not available in the provided material."
        
        return answer

    def _is_relevant_context(self, question: str, context: str) -> bool:
        """
        Check if context contains relevant information for the question.
        """
        question_lower = question.lower()
        context_lower = context.lower()

        question_keywords = [word for word in re.findall(r'\b\w+\b', question_lower) 
                            if len(word) > 3 and word not in ['what', 'when', 'where', 'which', 'how', 'does', 'this', 'that', 'these', 'those']]

        if not question_keywords:
            return True

        matches = sum(1 for keyword in question_keywords if keyword in context_lower)
        
        return matches >= max(1, len(question_keywords) * 0.3)

    def _extract_answer_from_context(self, question: str, context: str) -> str:
        """
        Extract answer from context using simple sentence extraction.
        Returns most relevant sentences from context.
        """
        sentences = re.split(r'[.!?]+', context)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

        if not sentences:
            return ""

        question_lower = question.lower()
        question_keywords = set(re.findall(r'\b\w+\b', question_lower))

        scored_sentences = []
        for sentence in sentences:
            sentence_lower = sentence.lower()
            sentence_words = set(re.findall(r'\b\w+\b', sentence_lower))
            overlap = len(question_keywords & sentence_words)
            scored_sentences.append((overlap, sentence))

        scored_sentences.sort(reverse=True, key=lambda x: x[0])

        if scored_sentences[0][0] == 0:
            return ""

        top_sentences = [sent for score, sent in scored_sentences[:2] if score > 0]
        
        return " ".join(top_sentences)
