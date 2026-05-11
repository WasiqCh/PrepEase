import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from services.extractor import extract_text
from services.vector_store import VectorStore
from services.qa_service import QAService
from services.quiz_generator import QuizGenerator


class MaterialRequest(BaseModel):
    filePath: str


class IngestRequest(BaseModel):
    materialId: str
    extractedText: str


class ChatRequest(BaseModel):
    materialId: str
    question: str


class QuizRequest(BaseModel):
    materialId: str
    difficulty: str
    questionCount: int


app = FastAPI(title="PrepEase AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = VectorStore()
qa_service = QAService(vector_store)
quiz_generator = QuizGenerator(vector_store)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/process-material")
def process_material(payload: MaterialRequest) -> dict:
    file_path = payload.filePath

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        extracted_text = extract_text(file_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Processing failed.") from exc

    return {
        "success": True,
        "extractedText": extracted_text,
    }


@app.post("/ingest")
def ingest_material(payload: IngestRequest) -> dict:
    try:
        vector_store.ingest(payload.materialId, payload.extractedText)
        return {"status": "stored"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(exc)}") from exc


@app.post("/chat")
def chat(payload: ChatRequest) -> dict:
    try:
        answer = qa_service.answer_question(payload.materialId, payload.question)
        return {"answer": answer}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(exc)}") from exc


@app.post("/generate-quiz")
def generate_quiz(payload: QuizRequest) -> dict:
    try:
        questions = quiz_generator.generate_quiz(
            payload.materialId,
            payload.difficulty,
            payload.questionCount
        )
        return {"questions": questions}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(exc)}") from exc
