# 🎓 NoteTube AI — Smart YouTube Learning & Study Material Generator

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Groq](https://img.shields.io/badge/AI%20Engine-Groq%20Cloud-f55036?logo=groq&logoColor=white)](https://groq.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**NoteTube AI** is an intelligent, full-stack web application that transforms YouTube video content into structured, academic-grade study material in seconds. Designed for students, educators, and lifelong learners, NoteTube AI extracts spoken content, cleans transcripts, and leverages high-speed Groq AI inference to create comprehensive lecture notes, question banks, flash-revision points, and exportable documents.

- **Live Frontend:** [https://note-tube-ai-lovat.vercel.app/](https://note-tube-ai-lovat.vercel.app/)
- **Repository:** [https://github.com/Omkari0208/NoteTube-AI.git](https://github.com/Omkari0208/NoteTube-AI.git)

---

## 🌟 Key Features

### 📖 1. AI-Powered Study Material Generation
- **Topic Overview & Title:** High-level executive summary of the lecture.
- **Detailed Content Breakdown:** In-depth, student-friendly explanation of core concepts.
- **Key Concepts & Definitions:** Essential terminology and core theoretical points.
- **Practical Examples:** Real-world illustrative examples matching the video context.
- **Quick Revision:** High-yield bullet points for last-minute exam prep.

### ❓ 2. Comprehensive Exam Question Banks
- **VSAQ (Very Short Answer Questions):** 5 direct, single-concept questions with answers.
- **SAQ (Short Answer Questions):** 5 intermediate-depth conceptual questions with answers.
- **LAQ (Long Answer Questions):** 3 essay-style, comprehensive analytical questions with answers.
- **Interactive MCQs:** 5 multiple-choice questions with answer keys and option choices.
- **Fill in the Blanks:** Targeted recall questions with answers.

### 📥 3. Multi-Format Document Export
- **PDF Export:** Export individual sections or full study guides with clean academic formatting.
- **Microsoft Word (.docx):** Fully editable document for personal note-taking.
- **PowerPoint (.pptx):** Automatically creates presentation slide decks from generated notes.

### 🔐 4. Authentication & History
- Secure JWT (JSON Web Token) authentication with `bcrypt` password hashing.
- User search history tracking and past lecture access.

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────────────┐
                    │       User / Web Browser        │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │    Vercel React + Vite App    │
                     │ (note-tube-ai-lovat.vercel.app│
                     └───────────────┬───────────────┘
                                     │ HTTPS REST API
                                     ▼
                     ┌───────────────────────────────┐
                     │     Render FastAPI Backend    │
                     │   (CORS + JWT Auth + SQLite/PG│
                     └───────┬───────────────┬───────┘
                             │               │
                             ▼               ▼
          ┌───────────────────────┐    ┌─────────────────────────┐
          │ YouTube Transcript API │    │ Groq AI Cloud API       │
          │ (Captions Extraction) │    │ (openai/gpt-oss-20b)    │
          └───────────────────────┘    └─────────────────────────┘
```

---

## 📁 Project Structure

```
NoteTube-AI/
├── backend/
│   ├── api/
│   │   ├── auth.py              # User signup, login, JWT token issuance
│   │   ├── history.py           # User search & notes history endpoints
│   │   └── videos.py            # Video validation, transcripts & note generation
│   ├── database/
│   │   ├── database.py          # SQLAlchemy engine (PostgreSQL + SQLite fallback)
│   │   └── models.py            # User and SearchHistory database models
│   ├── services/
│   │   ├── ai_service.py        # Groq API client & study notes prompt generator
│   │   ├── text_service.py      # Transcript cleaning and normalization
│   │   ├── transcript_service.py# YouTube transcript retrieval
│   │   └── youtube_service.py   # YouTube URL parsing and metadata extraction
│   ├── main.py                  # FastAPI application entrypoint & CORS middleware
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Template for backend environment variables
│   └── .env                     # Local backend environment variables (gitignored)
├── frontend/
│   ├── public/                  # Static assets and icons
│   ├── src/
│   │   ├── assets/              # Images, SVGs, and brand assets
│   │   ├── App.jsx              # Main UI, state management, search, and quiz engine
│   │   ├── App.css              # Custom styling, dark mode, animations
│   │   ├── downloadUtils.js     # PDF, Word (.docx), and PowerPoint (.pptx) exporters
│   │   ├── index.css            # Base Tailwind / layout styling
│   │   └── main.jsx             # React DOM root
│   ├── package.json             # Frontend npm dependencies and scripts
│   ├── vite.config.js           # Vite development and build configuration
│   └── .env.example             # Template for frontend environment variables
├── render.yaml                  # Infrastructure-as-code blueprint for Render
├── .gitignore                   # Ignored files (venv, node_modules, .env, *.db)
└── README.md                    # Project documentation
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
# Groq API Key for AI note generation
GROQ_API_KEY=gsk_your_groq_api_key_here

# Allowed origins for CORS (comma-separated)
CORS_ORIGINS=https://note-tube-ai-lovat.vercel.app

# Optional: PostgreSQL Database URL (if omitted, SQLite 'notetube.db' is used automatically)
# DATABASE_URL=postgresql://user:password@host:port/notetube_db

# Port for local server (Render sets $PORT automatically)
PORT=8000
```

### Frontend (`frontend/.env`)
```ini
# Production Render backend URL (or http://127.0.0.1:8000 for local development)
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.10+ (Python 3.11 or 3.12 recommended)
- Node.js 18+ and npm
- Groq Cloud API Key ([groq.com](https://console.groq.com))

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template and configure your GROQ_API_KEY
copy .env.example .env

# Run FastAPI server
python main.py
```
*Backend will be running at:* `http://127.0.0.1:8000` *(Docs at: `http://127.0.0.1:8000/docs`)*

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend will be running at:* `http://localhost:5173`

---

## 🌐 Deployment Guide

### A. Deploy Backend on Render (Free Web Service)

1. **Push Changes to GitHub:**
   Ensure the latest code is pushed to your GitHub repository.
2. **Create New Web Service:**
   - Log in to [Render Dashboard](https://dashboard.render.com).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository: `Omkari0208/NoteTube-AI`.
3. **Configure Service:**
   - **Name:** `notetube-ai-backend` (or custom name)
   - **Region:** Any preferred region (e.g., *Singapore*, *Frankfurt*, *Oregon*)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Free`
4. **Add Environment Variables:**
   - `GROQ_API_KEY`: `your_groq_api_key`
   - `CORS_ORIGINS`: `https://note-tube-ai-lovat.vercel.app`
   - `PYTHON_VERSION`: `3.11.9`
5. **Deploy:**
   Click **Deploy Web Service**. Once deployed, copy your Render URL:
   `https://<your-service-name>.onrender.com`

---

### B. Connect Vercel Frontend to Render Backend

1. Open your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your `note-tube-ai-lovat` project.
3. Navigate to **Settings** > **Environment Variables**.
4. Add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://<your-service-name>.onrender.com` *(your Render backend URL without trailing slash)*
   - **Target:** Production, Preview, Development.
5. Go to the **Deployments** tab, click **...** on the latest deployment, and click **Redeploy** (without cache).

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Backend root ping | No |
| `GET` | `/health` | Health check endpoint | No |
| `POST` | `/api/videos/validate` | Validates YouTube link and returns metadata | No |
| `POST` | `/api/videos/transcript` | Extracts and returns cleaned video transcript | No |
| `POST` | `/api/videos/generate-notes` | Generates full study notes & quiz sets | No |
| `POST` | `/api/auth/signup` | Registers a new user and issues JWT | No |
| `POST` | `/api/auth/login` | Authenticates user and issues JWT | No |
| `GET` | `/api/history/` | Returns search history of logged-in user | Yes (Bearer Token) |

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, Uvicorn, SQLAlchemy, Pydantic, python-jose (JWT), bcrypt.
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, jsPDF, html2canvas, docx, pptxgenjs.
- **AI & Data:** Groq Cloud SDK (`openai/gpt-oss-20b`), `youtube-transcript-api`.
- **Cloud Infrastructure:** Render (Backend), Vercel (Frontend).

---

## 📄 License

This project is licensed under the MIT License — feel free to use, modify, and distribute.
