-- ============================================================
-- Arc AI - MySQL Database Schema
-- Import this in phpMyAdmin or run: mysql -u root arc_ai < arc_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS arc_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE arc_ai;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) DEFAULT 'New Chat',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    session_id  INT NOT NULL,
    user_id     INT NOT NULL,
    role        ENUM('user','assistant','error') NOT NULL,
    content     TEXT NOT NULL,
    mode        VARCHAR(30) DEFAULT 'general',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for faster search
CREATE INDEX idx_messages_session  ON messages(session_id);
CREATE INDEX idx_messages_user     ON messages(user_id);
CREATE INDEX idx_sessions_user     ON chat_sessions(user_id);
