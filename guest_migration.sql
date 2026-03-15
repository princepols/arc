-- Guest Mode Tables
-- Run this on your Clever Cloud MySQL database via TablePlus

CREATE TABLE IF NOT EXISTS guest_sessions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    guest_id     VARCHAR(64) NOT NULL UNIQUE,
    prompt_count INT DEFAULT 0,
    converted    TINYINT(1) DEFAULT 0,
    converted_user_id INT DEFAULT NULL,
    ip_address   VARCHAR(64) DEFAULT NULL,
    first_seen   DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guest_id (guest_id),
    INDEX idx_converted (converted)
);

CREATE TABLE IF NOT EXISTS guest_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    guest_id   VARCHAR(64) NOT NULL,
    prompt     TEXT,
    mode       VARCHAR(32) DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guest_id (guest_id)
);