"""
Arc AI - FastAPI Backend (Revamped)
Entry point with auth, chat, and session routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes.auth     import router as auth_router
from routes.chat     import router as chat_router
from routes.sessions import router as sessions_router
from routes.upload   import router as upload_router
from routes.admin    import router as admin_router

app = FastAPI(title="Arc AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://arc-backend-zuv9.onrender.com"], #http://localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB tables on startup
@app.on_event("startup")
def startup():
    init_db()

app.include_router(auth_router,     prefix="/api/auth")
app.include_router(sessions_router, prefix="/api/sessions")
app.include_router(chat_router,     prefix="/api/chat")
app.include_router(upload_router,   prefix="/api/upload")
app.include_router(admin_router,    prefix="/api")

@app.get("/")
def root():
    return {"status": "Arc AI v2.0 running"}