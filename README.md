---

```markdown
# 🎓 PrepEase: AI-Assisted Educational Platform

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

</div>

<br />

PrepEase is a highly scalable, context-aware educational platform designed to eliminate AI hallucinations in the learning process. By leveraging **Retrieval-Augmented Generation (RAG)** and **Prompt Grounding**, PrepEase securely converts professor-uploaded lecture materials into mathematically validated quizzes, flashcards, and a hyper-accurate AI Study Buddy.

## 🚀 The Problem & Our Solution
Standard LLMs (like ChatGPT) frequently hallucinate facts or pull generic internet data when students use them to study. 

**The Solution:** PrepEase utilizes strict **Prompt Grounding**. When a teacher uploads a PDF, our text-extraction microservice processes the payload. The Google Gemini API is then forcefully grounded to *only* use that specific text as its source of truth, ensuring students only learn what the professor actually taught.

## 🏗️ System Architecture
PrepEase is built on a **Polyglot Microservice-Oriented Architecture** to achieve complete Separation of Concerns:
* **Frontend (Presentation Layer):** A React SPA utilizing Top-Down Data Flow and local state management for instant UI updates.
* **Backend (REST API):** A decoupled Node.js/Express server handling routing, validation, stateless authentication, and business logic.
* **AI/Processing Layer:** A dedicated Python microservice isolated to handle computationally heavy PDF text extraction, preventing the main Node.js event loop from blocking during large file uploads.
* **Database:** MongoDB Atlas (NoSQL) utilizing Mongoose schemas and **Compound Database Indexing** for blazing-fast resource discovery.

## ✨ Core Features
* **Stateless Authentication:** Secure, role-based access control (Teacher/Student) utilizing JSON Web Tokens (JWT) and bcrypt password hashing.
* **Structured Output Generation:** Forces the Gemini API to return strictly formatted JSON arrays, which are validated mathematically by custom Mongoose middleware before saving.
* **Automated Assessment Engine:** The `AssessmentController` handles automated mathematical grading of student quiz submissions, instantly pushing updates to the Teacher's Analytics Dashboard.
* **Context-Aware Study Buddy:** A persistent, history-aware chat interface utilizing a `ChatSession` database model to maintain student study sessions safely across browser reloads.
* **Efficient Data Reuse:** Extracts PDF text *once* and saves it to the database, allowing infinite generation of flashcards and quizzes without wasting secondary server extraction resources.

## 🛠️ Local Installation & Setup

### Prerequisites
* Node.js installed locally
* A MongoDB Atlas Cluster (or local instance)
* A valid Google Gemini API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/prepease.git](https://github.com/your-username/prepease.git)
cd prepease

```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory using the following template:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5001

```

### 3. Install Dependencies

Install modules for both the frontend and backend architectures.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

```

### 4. Start the Application

You will need two terminal windows to run the decoupled architecture locally.

```bash
# Terminal 1: Start the backend Node server
cd backend
npm start

# Terminal 2: Start the React frontend
cd frontend
npm run dev

```

The frontend will be accessible at `http://localhost:5173`.

## 👨‍💻 Contributors

This project was developed as a Final Year Project by:

* **Muhammad Wasiq Nadeem**
* **Muhammad Dawood**

```

```
