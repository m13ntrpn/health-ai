/**
 * User facts: долгосрочная память о пользователе (имя, цель, диета и т.д.).
 * Копировать в проект OpenClaw (например src/agent/userFacts.ts).
 *
 * Требуется таблица user_facts:
 *
 *   CREATE TABLE user_facts (
 *     id                SERIAL PRIMARY KEY,
 *     telegram_user_id  TEXT NOT NULL,
 *     key               TEXT NOT NULL,
 *     value             TEXT,
 *     created_at        TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at        TIMESTAMPTZ DEFAULT NOW(),
 *     UNIQUE(telegram_user_id, key)
 *   );
 *   CREATE INDEX idx_user_facts_user ON user_facts(telegram_user_id);
 */

/**
 * Загружает все факты пользователя в объект key → value.
 */
export async function loadUserFacts(telegramUserId: string): Promise<Record<string, string>> {
  // SELECT key, value FROM user_facts WHERE telegram_user_id = $1
  const rows = await queryUserFacts(telegramUserId);
  const out: Record<string, string> = {};
  for (const r of rows) {
    out[r.key] = r.value ?? "";
  }
  return out;
}

/**
 * Сохраняет или обновляет один факт.
 */
export async function saveUserFact(
  telegramUserId: string,
  key: string,
  value: string
): Promise<void> {
  // INSERT INTO user_facts (telegram_user_id, key, value, updated_at)
  // VALUES ($1, $2, $3, NOW())
  // ON CONFLICT (telegram_user_id, key) DO UPDATE SET value = $3, updated_at = NOW()
  await upsertUserFact(telegramUserId, key, value);
}

async function queryUserFacts(
  telegramUserId: string
): Promise<{ key: string; value: string | null }[]> {
  return [];
}

async function upsertUserFact(
  telegramUserId: string,
  key: string,
  value: string
): Promise<void> {
  // stub
}
