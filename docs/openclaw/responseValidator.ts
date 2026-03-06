/**
 * Response validator: проверка ответа на выдуманные медицинские факты перед отправкой в Telegram.
 * Копировать в проект OpenClaw (например src/agent/responseValidator.ts).
 */

const VALIDATOR_PROMPT = `Проверь этот ответ пользователю.

Есть ли в ответе выдуманные медицинские факты, цифры или рекомендации, которых не было в контексте?
Например: придуманные нормы, несуществующие исследования, конкретные дозировки без источника.

Ответь строго одним словом: yes или no.`;

/**
 * Возвращает true, если ответ прошёл проверку (нет выдуманных фактов).
 * При false вызывающий код может попросить LLM переписать ответ.
 */
export async function validateResponse(
  responseText: string,
  dataContextSnippet: string
): Promise<boolean> {
  const response = await callLlmForValidation(
    VALIDATOR_PROMPT,
    `Контекст данных:\n${dataContextSnippet}\n\nОтвет для проверки:\n${responseText}`
  );
  const normalized = response.trim().toLowerCase();
  return normalized.startsWith("no");
}

async function callLlmForValidation(systemPrompt: string, userMessage: string): Promise<string> {
  // TODO: вызов LLM (можно более дешёвая модель); вернуть "yes" или "no".
  throw new Error("Implement LLM call for validator");
}
