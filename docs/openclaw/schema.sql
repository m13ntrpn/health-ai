-- Схемы таблиц для агента nadin в БД OpenClaw.
-- Выполнить на той же БД, которую использует OpenClaw.

-- Краткосрочная память чата (последние сообщения для контекста LLM).
CREATE TABLE IF NOT EXISTS chat_memory (
  id                SERIAL PRIMARY KEY,
  telegram_user_id  TEXT NOT NULL,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_memory_user_created
  ON chat_memory(telegram_user_id, created_at DESC);

-- Долгосрочные факты о пользователе (имя, цель, диета и т.д.).
CREATE TABLE IF NOT EXISTS user_facts (
  id                SERIAL PRIMARY KEY,
  telegram_user_id  TEXT NOT NULL,
  key               TEXT NOT NULL,
  value             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_facts_user ON user_facts(telegram_user_id);
