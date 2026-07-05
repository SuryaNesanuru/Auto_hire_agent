# AutoHire AI: Autonomous Career Copilot 🚀

AutoHire AI is an enterprise-grade, privacy-centric AI copilot engineered to automate your job application pipelines. It discovers openings, parses listing specifications on LinkedIn/Greenhouse/Lever, analyzes matching resume metrics, and manages applications through an interactive Kanban board.

## 🛠️ Technology Stack
* **Web Dashboard**: Next.js 15 (App Router), TypeScript, Zustand context stores, Tailwind CSS.
* **REST API**: FastAPI, SQLAlchemy, SQLite/PostgreSQL, JWT token auth, and direct Pycrypt/Bcrypt verification algorithms.
* **Browser Extension**: Chrome Manifest V3 scraper with message brokers and public guest API adapters.
* **AI Pipelines**: Asynchronous Ollama inference loops with keyword token boundary matching fallbacks.

## 📂 Project Structure
```text
auto_job_agent/
├── backend/            # FastAPI Relational Server
│   ├── app/
│   │   ├── api/        # Endpoint routers (auth, jobs, resumes)
│   │   ├── domain/     # SQLAlchemy models & AI Core services
│   │   └── infrastructure/   # Database session connections & Repositories
│   └── requirements.txt
├── frontend/           # Next.js 15 Visual Web App
│   ├── src/
│   │   ├── app/        # Page components (Dashboard)
│   │   └── stores/     # Zustand state containers
│   └── package.json
└── extension/          # Chrome MV3 Extension
    ├── manifest.json   # Extension metadata
    ├── default_popup/  # popup.html & styles.css visual panels
    ├── background.js   # Background messaging router
    └── content.js      # Form scanner & parser
```

---

## ⚡ Quick Start (Local Run)

### 1. Build and Run Backend
```bash
cd backend
python -m venv venv
# Activate on Windows:
venv\Scripts\activate
# Install deps:
pip install -r requirements.txt
# Run FastAPI Server:
uvicorn app.main:app --reload
```
API matches on: `http://localhost:8000/docs`

### 2. Build and Run Dashboards
```bash
cd frontend
npm install
npm run dev
```
Open search dashboard on: `http://localhost:3000`

### 3. Register Browser Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle.
3. Click **Load unpacked** and select the `extension/` project directory.
