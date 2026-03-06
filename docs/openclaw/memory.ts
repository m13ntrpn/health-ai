/**
 * Memory: краткосрочная память чата для контекста LLM.
 * Копировать в проект OpenClaw (например src/agent/memory.ts).
 *
 * Требуется таблица chat_memory:
 *
 *   CREATE TABLE chat_memory (
 *     id            SERIAL PRIMARY KEY,
 *     telegram_user_id TEXT NOT NULL,
 *     role          TEXT NOT NULL,   -- 'user' | 'assistant' | 'system'
 *     content       TEXT NOT NULL,
 *     created_at    TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   CREATE INDEX idx_chat_memory_user_created ON chat_memory(telegram_user_id, created_at DESC);
 */

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  created_at?: string;
}

/**
 * Загружает последние N сообщений пользователя для контекста LLM.
 * limit по умолчанию 20.
 */
export async function loadMemory(
  telegramUserId: string,
  limit: number = 20
): Promise<ChatMessage[]> {
  // TODO: запрос к БД OpenClaw, например:
  // SELECT role, content, created_at FROM chat_memory
  // WHERE telegram_user_id = $1 ORDER BY created_at DESC LIMIT $2
  // затем развернуть в обратном порядке (chronological).
  const rows = await queryChatMemory(telegramUserId, limit);
  return rows.reverse();
}

/**
 * Сохраняет одно сообщение в историю чата.
 */
export async function saveMessage(
  telegramUserId: string,
  role: ChatRole,
  content: string
): Promise<void> {
  // INSERT INTO chat_memory (telegram_user_id, role, content) VALUES ($1, $2, $3)
  await insertChatMessage(telegramUserId, role, content);
}

async function queryChatMemory(
  telegramUserId: string,
  limit: number
): Promise<ChatMessage[]> {
  // Заглушка: заменить на реальный запрос к БД OpenClaw.
  return [];
}

async function insertChatMessage(
  telegramUserId: string,
  role: ChatRole,
  content: string
): Promise<void> {
  // Заглушка: заменить на реальный INSERT.
}
