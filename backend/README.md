# NationOS Backend Service: AI Fiscal Intelligence Engine

NationOS Backend is a high-performance Python application built with FastAPI, LlamaIndex, ChromaDB, and Supabase (PostgreSQL). It provides deterministic financial calculation, semantic vector search, and AI-assisted policy auditing over Nigerian public budget datasets.

---

## 1. System Architecture

The backend consists of four modular subsystems:

1. **FastAPI Application (`main.py`)**:
   - Exposes REST contracts for headline KPIs, statutory FAAC revenue distribution, sector planning, multi-scenario simulations, and citizen inquiries.
   - Configured with open CORS headers for seamless communication across local development ports (`4173` for Next.js, `8000` for FastAPI).

2. **LlamaIndex AI Engine (`ai_engine.py`)**:
   - Implements a `PandasQueryEngine` over the 500-row `lagos_budget_2026.csv` ground truth dataset.
   - Enforces a strict financial auditor persona requiring calculations in Nigerian Naira (`₦`).
   - Supports OpenRouter (`meta-llama/llama-3.1-8b-instruct`) and OpenAI models, paired with deterministic mathematical fallback logic when API keys are unconfigured.

3. **ChromaDB Vector Store (`vector_store.py`)**:
   - Local persistent vector database stored in `chroma_db/`.
   - Embeds and indexes all budget line items and statutory FAAC sharing formulas using fast ONNX embeddings (`all-MiniLM-L6-v2`) for semantic similarity retrieval.

4. **Persistence Layer (`database.py`)**:
   - Dual-mode data access: Connects directly to Supabase PostgreSQL when cloud credentials are provided, and automatically falls back to an embedded SQLite database (`data/nationos.db`) during offline or local development.

---

## 2. Prerequisites

Ensure your host system meets the following requirements:

- **Python**: Version 3.10, 3.11, 3.12, 3.13, or 3.14
- **Operating System**: Linux, macOS, or Windows (WSL recommended)
- **Node.js** (Optional): If running the Next.js frontend concurrently

---

## 3. Development Environment Setup

Follow these steps to configure your local development environment:

### Step 1: Clone Repository & Navigate to Backend
```bash
cd /home/cryptic/projects/nation-os/backend
```

### Step 2: Create a Virtual Environment
If a virtual environment does not already exist, create one using Python's built-in `venv` module:
```bash
python3 -m venv venv
```

### Step 3: Activate the Virtual Environment
- On Linux / macOS:
  ```bash
  source venv/bin/activate
  ```
- On Windows (Command Prompt):
  ```cmd
  venv\Scripts\activate.bat
  ```
- On Windows (PowerShell):
  ```powershell
  venv\Scripts\Activate.ps1
  ```

### Step 4: Install Dependencies
Install all required packages from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Step 5: Configure Environment Variables
Copy the example configuration to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to supply your credentials:
```ini
# Supabase PostgreSQL Credentials
SUPABASE_URL=https://rdtrmcqyiusqyhzigweu.supabase.co
SUPABASE_KEY=sb_publishable_raM73GXvs2STqa4B4GYSSQ_jhphkQXF

# Optional LLM API Keys (Leave blank to use local deterministic auditor)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct

# Server Bindings
HOST=127.0.0.1
PORT=8000
```

---

## 4. Ground Truth Data & Seeding

The application ships with `lagos_budget_2026.csv`, containing 500 realistic project line items across 20 Lagos Local Government Areas (LGAs) and 8 Ministries, Departments, and Agencies (MDAs).

To inspect or regenerate this dataset:
```bash
python app.py
```
This script populates realistic capital expenditures (roads, hospitals, drainage, solar installations) and recurrent overheads with variable project execution rates simulating real-world budget performance.

On first boot, `vector_store.py` automatically parses this CSV and embeds all rows into the persistent ChromaDB collection.

---

## 5. Running the Backend Server

### Option A: From Project Root (Recommended)
Run using the virtual environment interpreter from the project root:
```bash
cd /home/cryptic/projects/nation-os
PYTHONPATH=. backend/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Option B: From Inside the `backend` Directory
Activate the virtual environment and start Uvicorn:
```bash
cd /home/cryptic/projects/nation-os/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The server will be accessible at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc UI**: `http://127.0.0.1:8000/redoc`
- **Subsystem Health Status**: `http://127.0.0.1:8000/health`

---

## 6. Running Automated Tests

A comprehensive integration test suite is located in `test_api.py`. It verifies all 8 core API categories, vector retrieval, and database persistence.

To execute the test suite:
```bash
cd /home/cryptic/projects/nation-os
PYTHONPATH=. backend/venv/bin/python backend/test_api.py
```

### Verified Test Cases
1. `GET /health`: System diagnostic confirming ChromaDB and Supabase/SQLite connections.
2. `GET /api/v1/fiscal/overview`: Headline KPIs (`₦54.99tn`, `₦14.0tn`, `128` active projects) matching Figma specification.
3. `GET /api/v1/fiscal/revenue`: Distributable pool calculation and statutory FAAC tiers.
4. `GET /api/v1/jurisdictions`: Enumeration of all 37 subnational entities.
5. `POST /api/v1/budgets/recommend`: 6-stage structured AI investigation sequence.
6. `POST /api/v1/decisions`: Storing and reading back proposal records.
7. `POST /api/chat`: Natural language citizen auditing over Lagos budget line items.
8. `POST /api/allocate`: Proportional reduction simulation on recurrent overheads.

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check verifying ChromaDB, database, and LLM status. |
| `GET` | `/api/v1/fiscal/overview` | National overview dashboard summary and project execution snapshot. |
| `GET` | `/api/v1/fiscal/revenue` | Federation revenue receipts and statutory FAAC sharing distribution. |
| `GET` | `/api/v1/fiscal/revenue/trends` | Historical revenue receipts (2022 to 2026). |
| `GET` | `/api/v1/jurisdictions` | Subnational state profiles and demographic accounts. |
| `GET` | `/api/v1/sectors` | Essential sector developmental indices and baseline metrics. |
| `POST` | `/api/v1/budgets/recommend` | AI policy investigation trace and sector allocation recommendations. |
| `POST` | `/api/v1/budgets/calculate` | Deterministic capital plan projection and maintenance calculations. |
| `POST` | `/api/v1/scenarios/simulate` | Multi-horizon stress simulations (Balanced, Needs, Growth). |
| `GET` | `/api/v1/decisions` | Catalog of preserved decision proposal records. |
| `POST` | `/api/v1/decisions` | Store an immutable proposal snapshot and trade-offs. |
| `PATCH`| `/api/v1/decisions/{id}` | Update proposal review lifecycle status (`Reviewed`, `Rejected`). |
| `POST` | `/api/chat` | Citizen Transparency Portal query engine. |
| `POST` | `/api/allocate` | Executive revenue drop simulation with proportional overhead cuts. |

---

## 8. Troubleshooting

### Port 8000 Already in Use
If port 8000 is occupied, inspect running processes:
```bash
lsof -i :8000
```
Terminate the conflicting process or start Uvicorn on a different port:
```bash
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### ChromaDB Embedding Download
On the initial start, ChromaDB downloads the lightweight `all-MiniLM-L6-v2` ONNX model (~80 MB) to `~/.cache/chroma/`. Ensure an active internet connection is available during first run. Subsequent runs execute completely offline.

### Missing OpenRouter Key
If `OPENROUTER_API_KEY` is not provided in `.env`, the system automatically shifts to local deterministic auditing. Inquiries submitted to `/api/chat` and `/api/allocate` will compute exact mathematical calculations using Pandas without crashing.
