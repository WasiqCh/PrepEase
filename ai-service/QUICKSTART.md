# 🚀 Quick Start Guide - PrepEase AI Microservice

## Prerequisites
- Python 3.8+ installed
- Node.js backend running on port 5001

## Installation & Startup

### Option 1: Automatic (Recommended)
```bash
cd ai-service
./start.sh
```

### Option 2: Manual
```bash
cd ai-service

# Create virtual environment (first time only)
python3 -m venv ../.venv

# Activate virtual environment
source ../.venv/bin/activate  # On Windows: ..\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Verify Service

Open browser: http://localhost:8000/docs

Or test with curl:
```bash
curl http://localhost:8000/health
```

Expected response: `{"status":"healthy"}`

## Test the Service

```bash
# In a new terminal (keep service running)
cd ai-service
python test_service.py
```

## Usage Flow

### 1. Ingest Material
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "test_123",
    "extractedText": "Your educational content here..."
  }'
```

### 2. Ask Questions
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "test_123",
    "question": "What is the main topic?"
  }'
```

### 3. Generate Quiz
```bash
curl -X POST http://localhost:8000/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "test_123",
    "difficulty": "medium",
    "questionCount": 5
  }'
```

## Integration with Node.js Backend

Your Node.js backend should:

1. Extract PDF text (already implemented)
2. Send to `POST http://localhost:8000/ingest`
3. Store materialId in MongoDB
4. Route user queries to chat/quiz endpoints

Example integration code is in `ARCHITECTURE.md`

## Port Configuration

- **AI Service**: Port 8000 (this service)
- **Node.js Backend**: Port 5001 (your existing backend)
- **MongoDB**: Port 27017 (your existing database)

## First Run

⚠️ **Note**: On first run, the service will download the embedding model (~80MB). This is a one-time download.

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Model download fails
```bash
# Manually download model
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

## Development

Enable auto-reload (already enabled in start.sh):
```bash
uvicorn main:app --reload
```

View API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Production Deployment

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or use Gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Next Steps

1. ✅ Start this AI service
2. ✅ Test with test_service.py
3. 🔧 Integrate with Node.js backend
4. 📝 Update backend to call AI endpoints
5. 🚀 Deploy both services

## Support

- See `README.md` for API documentation
- See `ARCHITECTURE.md` for technical details
- Check `test_service.py` for usage examples

---

**Service Status**: Ready for integration with PrepEase backend 🎓
