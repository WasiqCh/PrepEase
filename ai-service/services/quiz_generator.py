import random
import re
from typing import List, Dict


class QuizGenerator:
    def __init__(self, vector_store):
        self.vector_store = vector_store

    def generate_quiz(self, material_id: str, difficulty: str, question_count: int) -> List[Dict]:
        """
        Generate quiz questions from the material content.
        Questions are based solely on provided content.
        """
        if not self.vector_store.material_exists(material_id):
            raise ValueError(f"Material {material_id} not found")

        chunks = self.vector_store.get_all_chunks(material_id)
        
        questions = self._generate_questions_from_chunks(chunks, difficulty, question_count)
        
        return questions

    def _generate_questions_from_chunks(self, chunks: List[str], difficulty: str, count: int) -> List[Dict]:
        """
        Generate questions by extracting key information from chunks.
        """
        questions = []
        sentences = []

        for chunk in chunks:
            chunk_sentences = re.split(r'[.!?]+', chunk)
            chunk_sentences = [s.strip() for s in chunk_sentences if len(s.strip()) > 30]
            sentences.extend(chunk_sentences)

        if len(sentences) < count:
            count = len(sentences)

        selected_sentences = random.sample(sentences, min(count * 2, len(sentences)))

        for sentence in selected_sentences:
            if len(questions) >= count:
                break

            question = self._create_question_from_sentence(sentence, difficulty)
            if question:
                questions.append(question)

        if len(questions) < count:
            for i in range(count - len(questions)):
                questions.append({
                    "question": f"What key concept is discussed in the material? (Question {i+1})",
                    "options": [
                        "Refer to the material for details",
                        "Multiple concepts are covered",
                        "Review the full content",
                        "Information varies"
                    ],
                    "correctAnswer": 0,
                    "difficulty": difficulty
                })

        return questions[:count]

    def _create_question_from_sentence(self, sentence: str, difficulty: str) -> Dict:
        """
        Create a multiple choice question from a sentence.
        """
        words = sentence.split()
        
        if len(words) < 8:
            return None

        entities = self._extract_key_terms(sentence)
        
        if not entities:
            return None

        target = entities[0]
        
        question_text = sentence.replace(target, "_____")
        
        if question_text == sentence:
            return None

        distractors = self._generate_distractors(target, difficulty)
        
        options = [target] + distractors
        random.shuffle(options)
        
        correct_answer = options.index(target)

        return {
            "question": f"Fill in the blank: {question_text}",
            "options": options,
            "correctAnswer": correct_answer,
            "difficulty": difficulty
        }

    def _extract_key_terms(self, sentence: str) -> List[str]:
        """
        Extract important terms from a sentence (nouns, capitalized words, numbers).
        """
        entities = []
        
        capitalized = re.findall(r'\b[A-Z][a-z]+\b', sentence)
        entities.extend(capitalized)

        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', sentence)
        entities.extend(numbers)

        words = sentence.split()
        long_words = [w.strip(',.!?;:') for w in words if len(w) > 6 and w.lower() not in 
                     ['however', 'therefore', 'although', 'because', 'through', 'without']]
        entities.extend(long_words[:2])

        return entities[:3]

    def _generate_distractors(self, correct_answer: str, difficulty: str) -> List[str]:
        """
        Generate plausible but incorrect answer options.
        """
        distractors = []
        
        if correct_answer.isdigit():
            num = int(correct_answer)
            distractors = [
                str(num + random.randint(1, 10)),
                str(num - random.randint(1, 10)),
                str(num * 2)
            ]
        elif re.match(r'\d+\.\d+', correct_answer):
            num = float(correct_answer)
            distractors = [
                f"{num + random.uniform(0.5, 2.0):.2f}",
                f"{num - random.uniform(0.5, 2.0):.2f}",
                f"{num * 1.5:.2f}"
            ]
        else:
            prefixes = ["Neo-", "Proto-", "Meta-", "Pseudo-"]
            suffixes = ["-like", "-based", "-oriented", "-centric"]
            
            distractors = [
                f"{random.choice(prefixes)}{correct_answer}",
                f"{correct_answer}{random.choice(suffixes)}",
                f"Alternative {correct_answer}"
            ]

        return distractors[:3]
