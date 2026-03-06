/**
 * Parser: извлечение структурированных данных из свободного текста пользователя.
 * Копировать в проект OpenClaw (например src/agent/parser.ts).
 */

export interface ParsedLogPayload {
  waterMl?: number | null;
  sleepStart?: string | null;
  sleepEnd?: string | null;
  mealDescription?: string | null;
  calories?: number | null;
  proteinG?: number | null;
  fatG?: number | null;
  carbsG?: number | null;
  mood?: string | null;
  energyLevel?: number | null;
  stressLevel?: number | null;
  activityType?: string | null;
  durationMin?: number | null;
  intensity?: "low" | "medium" | "high" | null;
  // замеры тела
  weightKg?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  bodyFatPercent?: number | null;
  bodyWaterPercent?: number | null;
  // прочее
  [key: string]: unknown;
}

const PARSER_PROMPT = `Извлеки данные из текста пользователя для дневника здоровья.

Ответь строго JSON со следующими полями (если в тексте нет — null):
waterMl (число, мл воды)
sleepStart (ISO время начала сна, например "2025-03-06T23:00:00.000Z")
sleepEnd (ISO время конца сна)
mealDescription (строка — что ел)
calories (число)
proteinG (число)
fatG (число)
carbsG (число)
mood (строка)
energyLevel (1-5)
stressLevel (1-5)
activityType (строка — тип активности)
durationMin (число, минуты)
intensity ("low" | "medium" | "high")
weightKg, waistCm, hipsCm, bodyFatPercent, bodyWaterPercent (числа для замеров)

Только JSON, без пояснений.`;

/**
 * Извлекает структурированные поля из сообщения пользователя.
 * Вызывать LLM с PARSER_PROMPT и userMessage; парсить JSON из ответа.
 */
export async function parseUserMessage(message: string): Promise<ParsedLogPayload> {
  const response = await callLlmForParser(PARSER_PROMPT, message);
  const text = response.trim().replace(/^```json?\s*|\s*```$/g, "");
  return JSON.parse(text) as ParsedLogPayload;
}

async function callLlmForParser(systemPrompt: string, userMessage: string): Promise<string> {
  // TODO: вызов OpenRouter/LLM; вернуть сырой ответ (JSON).
  throw new Error("Implement LLM call for parser and return response text");
}
