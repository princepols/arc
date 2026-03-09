"""
Arc AI - Database Connection
MySQL connection using PyMySQL for XAMPP.
"""

import os
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Create and return a new MySQL connection."""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "arc_ai"),
        cursorclass=pymysql.cursors.DictCursor,
        charset="utf8mb4",
    )


def init_db():
    """Initialize database tables if they don't exist."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Users table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id          INT AUTO_INCREMENT PRIMARY KEY,
                    username    VARCHAR(50)  NOT NULL UNIQUE,
                    email       VARCHAR(100) NOT NULL UNIQUE,
                    password    VARCHAR(255) NOT NULL,
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Chat sessions table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id          INT AUTO_INCREMENT PRIMARY KEY,
                    user_id     INT NOT NULL,
                    title       VARCHAR(255) DEFAULT 'New Chat',
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Messages table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id          INT AUTO_INCREMENT PRIMARY KEY,
                    session_id  INT NOT NULL,
                    user_id     INT NOT NULL,
                    role        ENUM('user', 'assistant', 'error') NOT NULL,
                    content     TEXT NOT NULL,
                    mode        VARCHAR(30) DEFAULT 'general',
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

        conn.commit()
        print("✅ Database tables initialized.")
    finally:
        conn.close()
