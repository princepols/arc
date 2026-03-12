# ⚡ Arc AI v2 — Full Stack Chatbot

Fully revamped with login/register, MySQL chat history, search, and real-time updates.

---

## What's New in v2
- 🔐 Login & Register with secure bcrypt passwords + JWT
- 🗄️ MySQL database (XAMPP) — users, sessions, messages
- 💾 Chat history saved per account
- 🔍 Search through past conversations
- 📱 Responsive design with collapsible sidebar
- ⚡ Real-time chat (no page reload)

---

## Setup Instructions

### 1. Database (XAMPP)
1. Start **XAMPP** and launch **phpMyAdmin** → `http://localhost/phpmyadmin`
2. Click **Import** → upload `backend/arc_schema.sql`
3. The `arc_ai` database and all tables will be created automatically

### 2. Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_groq_api_key_here
JWT_SECRET=any_long_random_string_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=arc_ai
```

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/sessions/` | List user sessions |
| POST | `/api/sessions/` | Create new session |
| DELETE | `/api/sessions/{id}` | Delete session |
| GET | `/api/sessions/search?q=` | Search chat history |
| GET | `/api/chat/{session_id}` | Load messages |
| POST | `/api/chat/{session_id}` | Send message |

---

## Database Schema

```
users          → id, username, email, password, created_at
chat_sessions  → id, user_id, title, created_at, updated_at
messages       → id, session_id, user_id, role, content, mode, created_at
```
