from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PrepEase Study Buddy AI Service")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models (loaded once on startup)
embedding_model = None
qa_tokenizer = None
qa_model = None

# In-memory storage for lecture embeddings (lectureId -> chunks + embeddings)
# In production, use MongoDB or FAISS
lecture_store = {}

class EmbedRequest(BaseModel):
    lectureId: str
    chunks: List[str]

class StudyBuddyRequest(BaseModel):
    question: str
    lectureId: str

class StudyBuddyResponse(BaseModel):
    answer: str
    confidence: str
    sources_used: int

@app.on_event("startup")
async def load_models():
    """Load models on startup to avoid loading on each request"""
    global embedding_model, qa_tokenizer, qa_model
    
    try:
        logger.info("Loading embedding model...")
        embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        logger.info("Loading QA model...")
        qa_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
        qa_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")
        
        # Move to GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        qa_model.to(device)
        
        logger.info(f"Models loaded successfully on {device}")
    except Exception as e:
        logger.error(f"Failed to load models: {str(e)}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "embedding_model": "loaded" if embedding_model else "not_loaded",
        "qa_model": "loaded" if qa_model else "not_loaded",
        "lectures_stored": len(lecture_store)
    }

@app.post("/embed")
async def embed_lecture(request: EmbedRequest):
    """
    Process and store lecture chunks with embeddings
    Called by Node.js after teacher uploads a file
    """
    try:
        if not embedding_model:
            raise HTTPException(status_code=503, detail="Embedding model not loaded")
        
        if not request.chunks or len(request.chunks) == 0:
            raise HTTPException(status_code=400, detail="No chunks provided")
        
        logger.info(f"Embedding {len(request.chunks)} chunks for lecture {request.lectureId}")
        
        # Generate embeddings for all chunks
        embeddings = embedding_model.encode(request.chunks, convert_to_numpy=True)
        
        # Store in memory (lectureId -> {chunks, embeddings})
        lecture_store[request.lectureId] = {
            "chunks": request.chunks,
            "embeddings": embeddings
        }
        
        logger.info(f"Successfully embedded lecture {request.lectureId}")
        
        return {
            "status": "success",
            "lectureId": request.lectureId,
            "chunks_embedded": len(request.chunks),
            "embedding_dim": embeddings.shape[1]
        }
        
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

@app.post("/study-buddy", response_model=StudyBuddyResponse)
async def study_buddy(request: StudyBuddyRequest):
    """
    Main Study Buddy endpoint - answers questions using RAG
    """
    try:
        if not embedding_model or not qa_model:
            raise HTTPException(status_code=503, detail="AI models not loaded")
        
        # Check if lecture exists
        if request.lectureId not in lecture_store:
            raise HTTPException(
                status_code=404, 
                detail="Lecture content not found. Please ensure the material has been uploaded and processed."
            )
        
        logger.info(f"Processing question for lecture {request.lectureId}")
        
        # Retrieve lecture data
        lecture_data = lecture_store[request.lectureId]
        chunks = lecture_data["chunks"]
        chunk_embeddings = lecture_data["embeddings"]
        
        # Embed the question
        question_embedding = embedding_model.encode([request.question], convert_to_numpy=True)[0]
        
        # Calculate cosine similarity with all chunks
        similarities = cosine_similarity(question_embedding, chunk_embeddings)
        
        # Get top 3 most relevant chunks
        top_k = min(3, len(chunks))
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        relevant_chunks = [chunks[i] for i in top_indices]
        top_similarities = [similarities[i] for i in top_indices]
        
        logger.info(f"Top similarities: {top_similarities}")
        
        # Check if the most relevant chunk has sufficient similarity
        if top_similarities[0] < 0.3:  # Threshold for relevance
            return StudyBuddyResponse(
                answer="The uploaded material does not cover this topic.",
                confidence="low",
                sources_used=0
            )
        
        # Construct context from relevant chunks
        context = "\n\n".join(relevant_chunks)
        
        # Create RAG prompt with strict instructions
        prompt = f"""You are a Study Buddy AI.
Answer the question using ONLY the provided lecture content.
If the answer is not present in the lecture, reply exactly:
'The uploaded material does not cover this topic.'

Lecture Content:
{context}

Question: {request.question}

Answer:"""
        
        # Generate answer using FLAN-T5
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inputs = qa_tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).to(device)
        
        with torch.no_grad():
            outputs = qa_model.generate(
                **inputs,
                max_length=150,
                min_length=10,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3
            )
        
        answer = qa_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Determine confidence based on similarity scores
        avg_similarity = np.mean(top_similarities)
        if avg_similarity > 0.6:
            confidence = "high"
        elif avg_similarity > 0.4:
            confidence = "medium"
        else:
            confidence = "low"
        
        logger.info(f"Generated answer with {confidence} confidence")
        
        return StudyBuddyResponse(
            answer=answer,
            confidence=confidence,
            sources_used=len(relevant_chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Study Buddy error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

def cosine_similarity(query_vec: np.ndarray, doc_vecs: np.ndarray) -> np.ndarray:
    """Calculate cosine similarity between query and document vectors"""
    query_norm = query_vec / np.linalg.norm(query_vec)
    doc_norms = doc_vecs / np.linalg.norm(doc_vecs, axis=1, keepdims=True)
    return np.dot(doc_norms, query_norm)

@app.delete("/lecture/{lectureId}")
async def delete_lecture(lectureId: str):
    """Delete lecture embeddings (cleanup)"""
    if lectureId in lecture_store:
        del lecture_store[lectureId]
        return {"status": "deleted", "lectureId": lectureId}
    else:
        raise HTTPException(status_code=404, detail="Lecture not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
