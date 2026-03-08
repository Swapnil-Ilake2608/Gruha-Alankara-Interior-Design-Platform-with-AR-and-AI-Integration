# QA Test Checklist (Step-by-Step)

## 1) Backend setup

1. Open terminal in `D:\GruhalankaraAiProject\backend`
2. Recreate virtual env if needed:
   - `python -m venv venv`
3. Activate:
   - `venv\Scripts\activate`
4. Install dependencies:
   - `pip install -r requirements.txt`
5. Start backend:
   - `uvicorn main:app --reload --host 127.0.0.1 --port 8000`

## 2) Backend health checks

1. Open `http://127.0.0.1:8000/`
2. Open `http://127.0.0.1:8000/health/ready`
3. Run milestone validator:
   - `python scripts\validate_milestones.py`
4. Run smoke tests:
   - `pytest tests\test_smoke_api.py -q`

## 3) Frontend setup

1. Open second terminal in `D:\GruhalankaraAiProject\frontend`
2. Install dependencies:
   - `npm install`
3. Run dev server:
   - `npm run dev`
4. Build check:
   - `npm run build`

## 4) Functional flow checks

1. Register user
2. Login and verify navbar shows user name
3. Analyze Room page:
   - Start Camera -> Capture
   - Upload Photo path
4. Ensure spinner appears with uploaded image preview
5. Complete analysis -> go to Design Studio
6. Verify recommendations are specific (not placeholders)
7. Ask Buddy AI:
   - show recommendations
   - book now
8. Verify booking is created and appears in profile history
9. Open Live AR camera and verify model controls:
   - select item
   - tap to place
   - drag to move
   - pinch to scale
10. Export PDF and Add to Catalog buttons

## 5) Regression checks

1. Home -> Select Style should route correctly and keep style context
2. No `furniture_recommendations.map is not a function` error
3. No 404 on upload route when backend is running
4. Camera stream stops when leaving page
5. Previous features still work after new changes
