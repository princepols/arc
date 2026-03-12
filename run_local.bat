@echo off
REM Start frontend
start cmd /k "cd C:\Users\princ\Downloads\arc v2\arc\frontend && npm run dev"

REM Start backend
start cmd /k "cd C:\Users\princ\Downloads\arc v2\arc\backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

exit