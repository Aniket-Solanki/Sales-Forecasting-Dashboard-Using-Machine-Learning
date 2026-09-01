@echo off
color 0B
echo ========================================================
echo      Starting Sales Forecasting Dashboard Services
echo ========================================================
echo.

echo [1/3] Starting FastAPI Backend on Port 8000...
start "FastAPI Backend" cmd /k "cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Starting Celery ML Worker...
start "Celery Worker" cmd /k "cd backend && celery -A app.worker.celery_app worker --loglevel=info --pool=solo"

echo [3/3] Starting Next.js Frontend on Port 3000...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo.
color 0A
echo ========================================================
echo   Success! All services launched in separate windows.
echo ========================================================
echo - Frontend URL: http://localhost:3000
echo - Backend API:  http://localhost:8000/docs
echo.
echo You can close this window. To stop the servers, just 
echo close their respective command prompt windows!
echo ========================================================
pause
