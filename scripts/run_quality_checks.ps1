# Run full local QA checks for Gruha Alankara

Write-Host "[1/3] Backend milestone validation" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\..\backend"
python scripts\validate_milestones.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/3] Backend smoke tests" -ForegroundColor Cyan
pytest tests\test_smoke_api.py -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/3] Frontend production build" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\..\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "All quality checks passed." -ForegroundColor Green
