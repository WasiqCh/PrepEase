# PrepEase AI Microservice

FastAPI-based AI service for the PrepEase education platform.

## Features

- **Material Ingestion**: Process and store PDF content with vector embeddings
- **AI Study Buddy**: Answer questions based on ingested material
- **Quiz Generation**: Generate contextual quizzes from content

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /ingest
Ingest material content and generate embeddings.

**Request:**
```json
{
  "materialId": "material_123",
  "extractedText": "Your PDF content here..."
}
```

**Response:**
```json
{
  "status": "stored"
}
```

### POST /chat
Ask questions about ingested material.

**Request:**
```json
{
  "materialId": "material_123",
  "question": "What is the main concept?"
}
```

**Response:**
```json
{
  "answer": "The main concept is..."
}
```

### POST /generate-quiz
Generate quiz questions from material.

**Request:**
```json
{
  "materialId": "material_123",
  "difficulty": "medium",
  "questionCount": 5
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "Fill in the blank: _____",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "difficulty": "medium"
    }
  ]
}
```

## Architecture

- **Text Chunking**: Splits content into overlapping chunks (500 words, 50 word overlap)
- **Embeddings**: Uses Sentence Transformers (all-MiniLM-L6-v2)
- **Storage**: In-memory vector store with FAISS-style cosine similarity
- **Retrieval**: Top-K semantic search for context retrieval

## Grounding Rules

All AI responses are strictly grounded in provided material. If information is not found:
> "This information is not available in the provided material."

## Port Configuration

Default: **Port 8000**  
Node.js Backend: **Port 5001**

## Internal Service

- No authentication required
- No database exposure
- Internal REST API communication only
