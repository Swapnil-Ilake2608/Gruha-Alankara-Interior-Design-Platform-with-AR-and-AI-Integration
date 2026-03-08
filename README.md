<<<<<<< HEAD
# Gruha Alankara - Final Submission

Gruha Alankara is an AI + AR interior design platform that enables users to capture or upload room images, receive personalized furniture recommendations, preview placements in live AR, and auto-book suggested items using Buddy AI.

## Final Status

- Functional completion: **97%**
- Core platform: **completed and working**
- Remaining polish: premium GLB model assets + optional demo evidence bundle

## Core Features Delivered

1. Authentication
- User register/login flow
- User name shown in navbar when logged in

2. Room Analysis
- Upload photo and camera capture flows
- Style selection and language selection
- Backend image analysis + AI recommendation generation
- Structured recommendation output (furniture, palette, layout tip)

3. Design Studio
- Recommendation cards with resolved names and color labels
- Save to catalog
- Export PDF
- Buddy AI chat integration

4. Buddy AI Agent
- Multilingual responses (English/Hindi/Telugu)
- "show recommendations" and "book now" flow
- Auto-booking from AI recommendations
- Booking confirmation includes **item prices**

5. Booking + Profile
- Booking records saved in SQLite
- Profile page shows booking history with price
- Supports re-login and persistent user history

6. AR Visualization
- Live AR camera view via browser camera
- Item selection, anchor placement, drag and pinch interactions
- Stable object behavior (no auto-spin)
- Fallback procedural 3D models when GLB files are missing

7. Quality Engineering
- API health and readiness endpoint
- Milestone validator script
- Backend smoke tests
- CI workflow for backend + frontend checks

## Project Structure

- Backend: `D:\GruhalankaraAiProject\backend`
- Frontend: `D:\GruhalankaraAiProject\frontend`
- QA scripts: `D:\GruhalankaraAiProject\backend\scripts`, `D:\GruhalankaraAiProject\scripts`
- CI: `D:\GruhalankaraAiProject\.github\workflows\quality.yml`

## Run Instructions

1. Backend
- `cd D:\GruhalankaraAiProject\backend`
- `python -m venv venv`
- `venv\Scripts\activate`
- `pip install -r requirements.txt`
- `uvicorn main:app --reload --host 127.0.0.1 --port 8000`

2. Frontend
- `cd D:\GruhalankaraAiProject\frontend`
- `npm install`
- `npm run dev`

## Quality Checks

- Backend validator: `python backend\scripts\validate_milestones.py`
- Backend smoke tests: `pytest backend\tests\test_smoke_api.py -q`
- Frontend build: `npm run build` (inside frontend)
- All-in-one (PowerShell): `scripts\run_quality_checks.ps1`

## Remaining Optional Enhancements

1. Add premium `.glb` assets in `frontend\public\models` for photoreal previews.
2. Capture a final demo evidence pack (screenshots + short walkthrough video).
=======
# Gruha-Alankara-Interior-Design-Platform-with-AR-and-AI-Integration
Gruha Alankara is an AI-powered interior design platform built with React and FastAPI. It analyzes room images, recommends design styles, and visualizes furniture placement using AR and 3D technologies. The system includes an AI assistant with multilingual voice support for smart interior design guidance.
>>>>>>> e667a5aacf907da9ebfde50756cf7a8050c11fa3
