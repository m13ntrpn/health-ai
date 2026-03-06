/**
 * Intent detection: определение намерения пользователя перед вызовом API.
 * Копировать в проект OpenClaw (например src/agent/intentDetector.ts).
 */

const INTENT_PROMPT = `Определи намерение пользователя по сообщению.

Возможные intents:
- chat — общий разговор, приветствие, вопрос не про данные
- log_food — записать приём пищи, что ел
- log_water — записать воду
- log_sleep — записать сон
- log_activity — записать активность, тренировку
- add_measurement — добавить замер тела (вес, объёмы и т.д.)
- report — запрос отчёта, "как дела", "как я за неделю"
- profile_update — обновить анкету/профиль
- lab_result — добавить результат анализов (сырой текст)
- medication — добавить/список постоянных лекарств или разовый приём в дневник

Ответь строго JSON в формате: { "intent": "<один из перечисленных>" }`;

export type Intent =
  | "chat"
  | "log_food"
  | "log_water"
  | "log_sleep"
  | "log_activity"
  | "add_measurement"
  | "report"
  | "profile_update"
  | "lab_result"
  | "medication";

export interface IntentResult {
  intent: Intent;
}

/**
 * Определяет намерение пользователя по тексту сообщения.
 * Вызывать LLM с промптом INTENT_PROMPT и userMessage; парсить JSON из ответа.
 */
export async function detectIntent(message: string): Promise<Intent> {
  // Заглушка: в реальности здесь вызов твоего LLM (OpenRouter и т.д.)
  // с промптом INTENT_PROMPT и message, затем парсинг JSON.
  const response = await callLlmForIntent(INTENT_PROMPT, message);
  const parsed = JSON.parse(response) as IntentResult;
  const valid: Intent[] = [
    "chat", "log_food", "log_water", "log_sleep", "log_activity",
    "add_measurement", "report", "profile_update", "lab_result", "medication",
  ];
  if (valid.includes(parsed.intent)) {
    return parsed.intent;
  }
  return "chat";
}

async function callLlmForIntent(systemPrompt: string, userMessage: string): Promise<string> {
  // TODO: подставить реальный вызов OpenRouter/LLM;
  // вернуть сырой текст ответа модели (должен быть JSON { "intent": "..." }).
  throw new Error("Implement LLM call (OpenRouter) and return response text");
}
