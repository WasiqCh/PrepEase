# PrepEase AI Microservice - Data Flow Diagrams

## 1. Material Ingestion Flow

```
┌─────────────┐
│   User      │
│ Uploads PDF │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         Node.js Backend (Port 5001)         │
│                                             │
│  1. Receive PDF file                        │
│  2. Extract text using PyMuPDF              │
│  3. Save material to MongoDB                │
│     {                                       │
│       _id: "mat_123",                       │
│       title: "AI Basics",                   │
│       filePath: "/uploads/file.pdf"         │
│     }                                       │
└──────────────────┬──────────────────────────┘
                   │
                   │ POST /ingest
                   │ {
                   │   materialId: "mat_123",
                   │   extractedText: "AI is..."
                   │ }
                   ▼
┌─────────────────────────────────────────────┐
│      Python AI Service (Port 8000)          │
│                                             │
│  4. Receive text + materialId               │
│  5. TextChunker splits into chunks:         │
│     ["AI is the simulation...",             │
│      "Machine learning is...",              │
│      "Deep learning uses..."]               │
│                                             │
│  6. Generate embeddings:                    │
│     Sentence Transformers                   │
│     ↓                                       │
│     [0.23, -0.45, 0.67, ...] (384-dim)     │
│                                             │
│  7. Store in memory:                        │
│     storage["mat_123"] = {                  │
│       chunks: [...],                        │
│       embeddings: [...],                    │
│       full_text: "..."                      │
│     }                                       │
└──────────────────┬──────────────────────────┘
                   │
                   │ Response: { status: "stored" }
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Node.js Backend                     │
│                                             │
│  8. Update material status in MongoDB       │
│     material.aiProcessed = true             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              ┌─────────┐
              │  User   │
              │ Notified│
              └─────────┘
```

## 2. Question Answering Flow (Study Buddy)

```
┌─────────────┐
│    User     │
│ Asks: "What │
│ is ML?"     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│    React Frontend (Port 3000)               │
│                                             │
│  POST /api/materials/mat_123/chat           │
│  { question: "What is ML?" }                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│    Node.js Backend (Port 5001)              │
│                                             │
│  1. Validate user & material access         │
│  2. Forward to AI service                   │
└──────────────────┬──────────────────────────┘
                   │
                   │ POST /chat
                   │ {
                   │   materialId: "mat_123",
                   │   question: "What is ML?"
                   │ }
                   ▼
┌─────────────────────────────────────────────┐
│    Python AI Service (Port 8000)            │
│                                             │
│  3. VectorStore.retrieve():                 │
│     ┌─────────────────────────────┐        │
│     │ Embed question:              │        │
│     │ "What is ML?"                │        │
│     │   ↓                          │        │
│     │ [0.12, -0.34, 0.56, ...]    │        │
│     │                              │        │
│     │ Calculate cosine similarity  │        │
│     │ with all chunks:             │        │
│     │                              │        │
│     │ chunk1: 0.85 ← Best match!  │        │
│     │ chunk2: 0.62                 │        │
│     │ chunk3: 0.73                 │        │
│     │                              │        │
│     │ Return top 3 chunks          │        │
│     └─────────────────────────────┘        │
│                                             │
│  4. QAService.answer_question():            │
│     ┌─────────────────────────────┐        │
│     │ Extract relevant sentences   │        │
│     │ from top chunks:             │        │
│     │                              │        │
│     │ "Machine learning is a       │        │
│     │  subset of AI that enables   │        │
│     │  systems to learn from data."│        │
│     │                              │        │
│     │ Check relevance:             │        │
│     │ Keywords match? ✓            │        │
│     │                              │        │
│     │ Return answer or fallback    │        │
│     └─────────────────────────────┘        │
└──────────────────┬──────────────────────────┘
                   │
                   │ Response: {
                   │   answer: "Machine learning is..."
                   │ }
                   ▼
┌─────────────────────────────────────────────┐
│    Node.js Backend                          │
│                                             │
│  5. Optional: Save to ChatHistory           │
│  6. Return answer to frontend               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│    React Frontend                           │
│                                             │
│  7. Display answer in chat interface        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              ┌─────────┐
              │  User   │
              │  Reads  │
              │ Answer  │
              └─────────┘
```

## 3. Quiz Generation Flow

```
┌─────────────┐
│    User     │
│ Clicks      │
│"Generate    │
│ Quiz"       │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│    React Frontend                           │
│                                             │
│  POST /api/materials/mat_123/generate-quiz  │
│  {                                          │
│    difficulty: "medium",                    │
│    questionCount: 5                         │
│  }                                          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│    Node.js Backend                          │
│                                             │
│  1. Validate user & material                │
│  2. Forward to AI service                   │
└──────────────────┬──────────────────────────┘
                   │
                   │ POST /generate-quiz
                   │ {
                   │   materialId: "mat_123",
                   │   difficulty: "medium",
                   │   questionCount: 5
                   │ }
                   ▼
┌─────────────────────────────────────────────┐
│    Python AI Service                        │
│                                             │
│  3. VectorStore.get_all_chunks():           │
│     Retrieve all stored chunks              │
│                                             │
│  4. QuizGenerator.generate_quiz():          │
│     ┌─────────────────────────────┐        │
│     │ Split chunks into sentences  │        │
│     │                              │        │
│     │ For each sentence:           │        │
│     │   • Extract key terms        │        │
│     │     - Entities                │        │
│     │     - Numbers                 │        │
│     │     - Important words         │        │
│     │                              │        │
│     │   • Create fill-in-blank:    │        │
│     │     "ML is a subset of ___" │        │
│     │                              │        │
│     │   • Generate distractors:    │        │
│     │     ["AI", "DL", "NLP", "CV"]│        │
│     │                              │        │
│     │   • Shuffle options          │        │
│     │                              │        │
│     │   • Record correct answer    │        │
│     └─────────────────────────────┘        │
│                                             │
│  5. Return questions array                  │
└──────────────────┬──────────────────────────┘
                   │
                   │ Response: {
                   │   questions: [
                   │     {
                   │       question: "...",
                   │       options: [...],
                   │       correctAnswer: 0,
                   │       difficulty: "medium"
                   │     }
                   │   ]
                   │ }
                   ▼
┌─────────────────────────────────────────────┐
│    Node.js Backend                          │
│                                             │
│  6. Optional: Save quiz to MongoDB          │
│     {                                       │
│       materialId: "mat_123",                │
│       questions: [...],                     │
│       createdBy: userId,                    │
│       createdAt: Date.now()                 │
│     }                                       │
│                                             │
│  7. Return to frontend                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│    React Frontend                           │
│                                             │
│  8. Render quiz interface                   │
│     • Display questions one by one          │
│     • Allow option selection                │
│     • Track user answers                    │
│     • Calculate score                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              ┌─────────┐
              │  User   │
              │  Takes  │
              │  Quiz   │
              └─────────┘
```

## 4. Memory Storage Structure

```
┌──────────────────────────────────────────────┐
│     VectorStore.storage (In-Memory Dict)     │
├──────────────────────────────────────────────┤
│                                              │
│  "mat_123": {                                │
│    chunks: [                                 │
│      "AI is the simulation of human...",     │
│      "Machine learning enables systems...",  │
│      "Deep learning uses neural networks..." │
│    ],                                        │
│    embeddings: [                             │
│      [0.23, -0.45, 0.67, ...],  ← 384-dim   │
│      [0.12, -0.34, 0.56, ...],              │
│      [0.45, -0.23, 0.78, ...]               │
│    ],                                        │
│    full_text: "AI is the simulation..."      │
│  },                                          │
│                                              │
│  "mat_456": {                                │
│    chunks: [...],                            │
│    embeddings: [...],                        │
│    full_text: "..."                          │
│  }                                           │
│                                              │
└──────────────────────────────────────────────┘
```

## 5. Error Handling Flow

```
┌─────────────────────────────────────────┐
│  Request arrives with invalid materialId │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ Check if materialId │
         │ exists in storage   │
         └──────────┬──────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
       NOT FOUND           FOUND
          │                   │
          ▼                   ▼
┌──────────────────┐   ┌──────────────┐
│ Raise ValueError │   │   Process    │
│ "Material not    │   │   Request    │
│  found"          │   │              │
└────────┬─────────┘   └──────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ FastAPI Exception Handler       │
│                                 │
│ HTTPException(                  │
│   status_code=404,              │
│   detail="Material not found"   │
│ )                               │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ JSON Response:               │
│ {                            │
│   "detail": "Material not    │
│             found"            │
│ }                            │
└──────────────────────────────┘
```

## 6. Grounding Logic Flow

```
User Question: "What is quantum computing?"

         ┌─────────────────────┐
         │ Retrieve top-3      │
         │ chunks via          │
         │ semantic search     │
         └──────┬──────────────┘
                │
                ▼
      ┌──────────────────┐
      │ Chunks retrieved: │
      │ - AI basics       │
      │ - ML algorithms   │
      │ - DL networks     │
      └──────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │ Extract keywords    │
   │ from question:      │
   │ ["quantum",         │
   │  "computing"]       │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Check if keywords   │
   │ appear in chunks    │
   └──────┬──────────────┘
          │
          ▼
    ┌─────────┴────────┐
    │                  │
 FOUND             NOT FOUND
    │                  │
    ▼                  ▼
┌──────────┐   ┌───────────────────┐
│ Extract  │   │ Return fallback:  │
│ answer   │   │ "This information │
│ from     │   │  is not available │
│ chunks   │   │  in the provided  │
└──────────┘   │  material."       │
               └───────────────────┘
```

---

## Summary

### Key Data Flows:
1. **Upload → Extract → Chunk → Embed → Store**
2. **Question → Embed → Search → Extract → Answer**
3. **Generate → Extract Terms → Create MCQ → Return**

### Performance Optimizations:
- Embeddings cached (no re-computation)
- In-memory storage (fast retrieval)
- Parallel processing possible
- Top-K search limits computation

### Grounding Mechanism:
- Always search existing chunks
- Match keywords for relevance
- Return fallback if no match
- Never generate unsupported content

