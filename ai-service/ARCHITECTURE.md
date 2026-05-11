# PrepEase AI Microservice - Technical Architecture

## 📁 Project Structure

```
ai-service/
├── main.py                      # FastAPI application with all endpoints
├── requirements.txt             # Python dependencies
├── start.sh                     # Service startup script
├── test_service.py             # Integration tests
├── README.md                    # User documentation
└── services/
    ├── text_chunker.py         # Text chunking logic
    ├── vector_store.py         # Embedding & retrieval engine
    ├── qa_service.py           # Question answering service
    ├── quiz_generator.py       # Quiz generation service
    ├── extractor.py            # PDF text extraction (existing)
    └── summarizer.py           # Summarization (existing)
```

## 🎯 Core Components

### 1. Text Chunker (`text_chunker.py`)
- **Purpose**: Split long documents into manageable chunks
- **Strategy**: Overlapping word-based chunking
- **Configuration**:
  - Chunk size: 500 words
  - Overlap: 50 words (preserves context across boundaries)
- **Why overlapping?** Prevents information loss at chunk boundaries

### 2. Vector Store (`vector_store.py`)
- **Purpose**: Store and retrieve document embeddings
- **Model**: Sentence Transformers (`all-MiniLM-L6-v2`)
  - Lightweight (80MB)
  - Fast inference
  - Good semantic understanding
- **Storage**: In-memory dictionary
  - Key: `materialId`
  - Value: `{chunks, embeddings, full_text}`
- **Retrieval**: Cosine similarity search
- **Performance**: No re-embedding on queries (embeddings cached)

### 3. QA Service (`qa_service.py`)
- **Purpose**: Answer questions based on material content
- **Process**:
  1. Retrieve top-K relevant chunks (K=3)
  2. Extract answer using rule-based methods
  3. Check relevance using keyword matching
  4. Return grounded answer or fallback message
- **Grounding Rule**: If answer not in content → 
  `"This information is not available in the provided material."`

### 4. Quiz Generator (`quiz_generator.py`)
- **Purpose**: Generate multiple-choice questions from content
- **Strategy**:
  - Extract key terms (entities, numbers, important words)
  - Create fill-in-the-blank questions
  - Generate plausible distractors
  - Difficulty affects distractor complexity
- **Question Types**:
  - Numeric (generates nearby values)
  - Textual (generates variations with prefixes/suffixes)

## 🔌 API Endpoints

### Health Check
```
GET /health
Response: { "status": "healthy" }
```

### Process Material (Legacy)
```
POST /process-material
Body: { "filePath": "/path/to/file.pdf" }
Response: { "success": true, "extractedText": "..." }
```

### Ingest Material
```
POST /ingest
Body: { 
  "materialId": "mat_123", 
  "extractedText": "content..." 
}
Response: { "status": "stored" }
```

### Chat / Ask Questions
```
POST /chat
Body: { 
  "materialId": "mat_123", 
  "question": "What is X?" 
}
Response: { "answer": "X is..." }
```

### Generate Quiz
```
POST /generate-quiz
Body: { 
  "materialId": "mat_123", 
  "difficulty": "medium", 
  "questionCount": 5 
}
Response: { 
  "questions": [
    {
      "question": "Fill in: ___",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "difficulty": "medium"
    }
  ]
}
```

## 🧠 How It Works

### Material Ingestion Flow
```
1. Node.js backend extracts PDF text
2. Sends POST /ingest with materialId + extractedText
3. AI service chunks text (500 words, 50 overlap)
4. Generates embeddings using Sentence Transformers
5. Stores in memory: storage[materialId] = {chunks, embeddings, text}
6. Returns { status: "stored" }
```

### Question Answering Flow
```
1. User asks question via Node.js backend
2. POST /chat with materialId + question
3. AI service embeds question
4. Finds top 3 most similar chunks (cosine similarity)
5. Extracts relevant sentences from chunks
6. Returns answer OR "not available" message
```

### Quiz Generation Flow
```
1. POST /generate-quiz with materialId + difficulty + count
2. Retrieves all chunks for material
3. Extracts sentences from chunks
4. Identifies key terms (entities, numbers, long words)
5. Creates fill-in-blank questions
6. Generates 3 distractors per question
7. Returns array of MCQ objects
```

## 🔒 Security & Design Decisions

### Why No Authentication?
- **Internal service**: Only accessible by Node.js backend
- Backend handles all auth/authorization
- AI service trusts incoming requests

### Why In-Memory Storage?
- **Fast**: No database overhead
- **Simple**: No external dependencies
- **Sufficient**: Materials aren't massive
- **Scalable**: Can migrate to Redis/PostgreSQL later

### Why Sentence Transformers?
- **Free**: No API costs (unlike OpenAI)
- **Private**: Data stays on server
- **Fast**: Local inference
- **Good enough**: 80-90% quality of larger models

### Why Rule-Based QA?
- **Deterministic**: Predictable behavior
- **Grounded**: Can't hallucinate
- **Debuggable**: Easy to fix issues
- **Cost**: Zero API costs

## 📊 Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| Ingest | O(n * m) | n=chunks, m=embedding_dim |
| Chat | O(n) | n=number_of_chunks |
| Quiz Gen | O(n * k) | n=sentences, k=question_count |

**Expected Response Times** (on modern hardware):
- Ingest (1000 words): ~500ms
- Chat query: ~100-200ms
- Quiz (5 questions): ~200-300ms

## 🚀 Deployment

### Development
```bash
cd ai-service
./start.sh
```

### Production
```bash
# Install dependencies
pip install -r requirements.txt

# Run with more workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Future)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔧 Configuration

Environment variables (optional):
```bash
HOST=0.0.0.0
PORT=8000
MODEL_NAME=all-MiniLM-L6-v2
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

## 🧪 Testing

```bash
# Start service
./start.sh

# In another terminal
python test_service.py
```

## 🔄 Integration with Node.js Backend

The Node.js backend should:

1. **Extract PDF text** using its existing logic
2. **Call POST /ingest** with materialId + extractedText
3. **Store materialId** in MongoDB
4. **Route chat requests** to POST /chat
5. **Route quiz requests** to POST /generate-quiz

Example Node.js code:
```javascript
const axios = require('axios');

const AI_SERVICE_URL = 'http://localhost:8000';

// After PDF extraction
async function ingestMaterial(materialId, text) {
  const response = await axios.post(`${AI_SERVICE_URL}/ingest`, {
    materialId,
    extractedText: text
  });
  return response.data;
}

// Handle chat
async function askQuestion(materialId, question) {
  const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
    materialId,
    question
  });
  return response.data.answer;
}

// Generate quiz
async function generateQuiz(materialId, difficulty, count) {
  const response = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
    materialId,
    difficulty,
    questionCount: count
  });
  return response.data.questions;
}
```

## 📈 Future Enhancements

1. **Persistent Storage**: Migrate to PostgreSQL + pgvector
2. **Better QA**: Integrate small LLM (Llama 3.2 1B)
3. **Caching**: Add Redis for query caching
4. **Monitoring**: Add Prometheus metrics
5. **Rate Limiting**: Prevent abuse
6. **Batch Processing**: Handle multiple materials simultaneously

## 🐛 Troubleshooting

### Service won't start
```bash
# Check Python version
python3 --version  # Should be 3.8+

# Check dependencies
pip list | grep fastapi

# Reinstall
pip install -r requirements.txt --force-reinstall
```

### Model download issues
```bash
# First run downloads model (~80MB)
# If stuck, manually download:
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Memory issues
```bash
# Reduce chunk size in vector_store.py
# Or add pagination for large materials
```

## 📝 License

Part of PrepEase platform - Internal use only
