# 📋 PrepEase AI Service - Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Verify File Structure
```bash
cd ai-service
ls -la
```

Expected files:
- [x] main.py
- [x] requirements.txt
- [x] start.sh
- [x] services/text_chunker.py
- [x] services/vector_store.py
- [x] services/qa_service.py
- [x] services/quiz_generator.py
- [x] test_service.py
- [x] README.md
- [x] QUICKSTART.md
- [x] ARCHITECTURE.md
- [x] integration-example.js

### 2. Install Dependencies
```bash
cd ai-service
source ../.venv/bin/activate  # or create new venv
pip install -r requirements.txt
```

Expected packages:
- [x] fastapi
- [x] uvicorn
- [x] sentence-transformers
- [x] numpy
- [x] pymupdf
- [x] python-pptx

### 3. Test Service Locally
```bash
# Terminal 1: Start service
cd ai-service
./start.sh

# Terminal 2: Run tests
python test_service.py
```

Expected results:
- [x] Health check passes
- [x] Ingest material succeeds
- [x] Chat returns answers
- [x] Quiz generation works

### 4. Verify Endpoints
Open browser: http://localhost:8000/docs

Check endpoints:
- [x] GET /health
- [x] POST /process-material
- [x] POST /ingest
- [x] POST /chat
- [x] POST /generate-quiz

## 🔧 Backend Integration Checklist

### 1. Update Node.js Backend

Add AI service client:
- [ ] Copy `integration-example.js` patterns
- [ ] Install axios: `npm install axios`
- [ ] Add AI_SERVICE_URL to .env: `AI_SERVICE_URL=http://localhost:8000`

### 2. Material Upload Flow

Update material upload endpoint:
- [ ] Extract PDF text (existing)
- [ ] Save to MongoDB (existing)
- [ ] Call `POST /ingest` with materialId + text (NEW)
- [ ] Handle errors gracefully

Example:
```javascript
const aiService = require('./services/aiService');

// After saving material to MongoDB
await aiService.ingestMaterial(material._id, extractedText);
```

### 3. Study Buddy Feature

Create chat endpoint:
- [ ] Create route: `POST /api/materials/:materialId/chat`
- [ ] Verify material exists in MongoDB
- [ ] Call `POST /chat` on AI service
- [ ] Return answer to frontend
- [ ] Optional: Save chat history

### 4. Quiz Generation Feature

Create quiz endpoint:
- [ ] Create route: `POST /api/materials/:materialId/generate-quiz`
- [ ] Accept difficulty & questionCount params
- [ ] Call `POST /generate-quiz` on AI service
- [ ] Return questions to frontend
- [ ] Optional: Save quiz to MongoDB

### 5. Error Handling

Add error handling:
- [ ] Handle AI service unavailable (503)
- [ ] Handle material not found (404)
- [ ] Handle invalid requests (400)
- [ ] Add retry logic for transient failures

### 6. Testing

Test integration:
- [ ] Upload a material → verify ingestion
- [ ] Ask questions → verify answers
- [ ] Generate quiz → verify questions
- [ ] Test with invalid materialId
- [ ] Test when AI service is down

## 🚀 Deployment Checklist

### Development Environment

- [ ] AI service runs on port 8000
- [ ] Node.js backend runs on port 5001
- [ ] Both services can communicate
- [ ] CORS is configured correctly
- [ ] Test end-to-end flow

### Production Environment

**AI Service:**
- [ ] Install Python 3.8+ on server
- [ ] Clone repository
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Set environment variables
- [ ] Run with multiple workers: `uvicorn main:app --workers 4`
- [ ] Set up process manager (PM2/systemd)
- [ ] Configure firewall rules

**Node.js Backend:**
- [ ] Update AI_SERVICE_URL to production URL
- [ ] Deploy with updated code
- [ ] Verify connectivity to AI service
- [ ] Test all integrated endpoints

**Infrastructure:**
- [ ] Both services behind reverse proxy (nginx)
- [ ] HTTPS configured
- [ ] Health check monitoring
- [ ] Log aggregation setup
- [ ] Backup strategy for data

## 🔍 Verification Steps

### 1. Smoke Test
```bash
# Test health
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

### 2. Integration Test
```bash
# Run full test suite
python test_service.py

# All tests should pass
```

### 3. End-to-End Test

Full user flow:
1. [ ] Upload a PDF material via frontend
2. [ ] Verify material appears in MongoDB
3. [ ] Verify AI service has ingested material
4. [ ] Open Study Buddy and ask a question
5. [ ] Verify answer is relevant and grounded
6. [ ] Generate a quiz
7. [ ] Verify questions are based on content
8. [ ] Take the quiz
9. [ ] Verify scoring works

### 4. Performance Test

Basic load test:
```bash
# Install apache bench
# apt-get install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 http://localhost:8000/health

# Check response times
```

Expected performance:
- [ ] Health check: < 10ms
- [ ] Ingest: < 1s (for typical material)
- [ ] Chat: < 200ms
- [ ] Quiz: < 500ms

## 📊 Monitoring Checklist

### Logs
- [ ] AI service logs to stdout
- [ ] Node.js backend logs API calls
- [ ] Error tracking configured
- [ ] Log rotation setup

### Metrics
- [ ] Track request counts
- [ ] Track response times
- [ ] Track error rates
- [ ] Monitor memory usage

### Alerts
- [ ] Alert on service down
- [ ] Alert on high error rate
- [ ] Alert on slow responses
- [ ] Alert on memory issues

## 🐛 Troubleshooting

### AI Service Won't Start
```bash
# Check Python version
python3 --version  # Should be 3.8+

# Check dependencies
pip list

# Reinstall
pip install -r requirements.txt --force-reinstall

# Check port availability
lsof -i:8000
```

### Backend Can't Connect
```bash
# Verify AI service is running
curl http://localhost:8000/health

# Check network connectivity
ping localhost

# Verify URL in backend .env
echo $AI_SERVICE_URL
```

### Slow Responses
```bash
# Check system resources
htop

# Check AI service logs
tail -f logs/ai-service.log

# Increase workers
uvicorn main:app --workers 8
```

### Memory Issues
```bash
# Monitor memory
free -h

# Check process memory
ps aux | grep uvicorn

# Consider reducing chunk size or adding pagination
```

## ✨ Optional Enhancements

Future improvements:
- [ ] Add Redis caching for frequent queries
- [ ] Implement rate limiting
- [ ] Add request authentication
- [ ] Migrate to PostgreSQL + pgvector
- [ ] Add telemetry/metrics
- [ ] Implement A/B testing
- [ ] Add admin dashboard

## 📝 Documentation Updates

- [ ] Update main README with AI features
- [ ] Document API endpoints in Swagger
- [ ] Create user guide for Study Buddy
- [ ] Create user guide for Quiz Generation
- [ ] Update deployment documentation

## 🎉 Launch Checklist

Final steps before launch:
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Monitoring in place
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Team trained
- [ ] Rollback plan ready

---

**Status**: Ready for integration and deployment! 🚀
