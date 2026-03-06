/**
 * Промпт для извлечения данных лога (еда, вода, сон, активность) из сообщения.
 * Копировать в проект OpenClaw (например src/prompts/logPrompt.ts).
 */

export const LOG_EXTRACTION_PROMPT = `Извлеки из сообщения пользователя данные для дневника здоровья.

Нужны поля (если есть в тексте): вода (мл), начало/конец сна (время), описание приёма пищи, калории, белки/жиры/углеводы (г), настроение, уровень энергии и стресса (1-5), тип и длительность активности, интенсивность (low/medium/high).

Ответь строго JSON с полями: waterMl, sleepStart, sleepEnd, mealDescription, calories, proteinG, fatG, carbsG, mood, energyLevel, stressLevel, activityType, durationMin, intensity. Значения отсутствующих — null.`;
