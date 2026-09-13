# AI HR Decision Dashboard

A hackathon-ready HR intelligence MVP. It combines recruitment, attendance, performance, and workforce signals into a single decision dashboard, with clearly swappable AI and workflow integrations.

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: FastAPI, SQLAlchemy, SQLite
- Integrations: `AIService` (Qwen-ready) and `WorkflowService` (EnterPro-ready) interfaces

## Quick start

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The app creates and seeds `backend/hr_dashboard.db` on first start. API docs are at `http://localhost:8000/docs`.

### Frontend

```powershell
npm run install:frontend
npm run dev
```

Run these commands from the workspace root. `npm run dev` starts the Vite app in `frontend`; the frontend proxies `/api` to FastAPI. Open the URL Vite prints (usually `http://localhost:5173`).

## Project layout

```
backend/app/       API, schema, seeded SQLite database, integration interfaces
frontend/src/      Dashboard UI and API client
docs/api-contracts.md
backend/data/      Mock source data
```

## Integration seams

- The deterministic analytics and risk engines always remain the source of truth.
- To enable Qwen reasoning, copy `.env.example` to `.env`, set `QWEN_API_KEY`, then restart FastAPI. The service uses `QWEN_MODEL=qwen-plus` and the DashScope OpenAI-compatible base URL by default.
- Qwen receives a compact calculated evidence context and must return validated JSON that cites supplied evidence IDs. Without a key, the UI stays in analytics-only fallback mode.
- EnterPro is not implemented.
