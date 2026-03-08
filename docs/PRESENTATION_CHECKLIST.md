# Final Presentation Checklist

## Environment

- Backend server starts without error
- Frontend dev server starts without error
- Browser has camera permissions enabled
- `.env` contains valid keys (if using external providers)

## Functional Checks

- Register/Login works
- Logged-in user name shown in navbar
- Analyze via upload works
- Analyze via camera capture works
- AI recommendations are specific (not placeholders)
- Buddy responds in selected language
- Buddy booking creates records
- Buddy booking response includes prices
- Profile history shows booked items + prices
- Save to catalog works
- Export PDF works
- Live AR camera opens
- AR object remains stable by default

## Technical Checks

- `GET /` returns backend status
- `GET /health/ready` returns ready state
- `python backend\scripts\validate_milestones.py` passes
- `pytest backend\tests\test_smoke_api.py -q` passes
- `npm run build` in frontend passes

## Delivery Assets

- README prepared
- Architecture document prepared
- Demo script prepared
- Completion report prepared
