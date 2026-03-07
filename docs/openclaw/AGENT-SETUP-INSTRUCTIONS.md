# Инструкция для настройки агента nadin в OpenClaw (вставь в чат)

Создай нового агента с именем nadin и настрой его так.

## Цель агента

Персональный помощник по здоровью. Пользователь общается в Telegram свободным текстом. Агент:
- при первом контакте проверяет анкету (checkProfile) и при необходимости ведёт онбординг;
- распознаёт намерения: запись еды, воды, сна, активности, замеров, анализов, лекарств, запрос отчёта или обновление профиля;
- вызывает API nadin-health (POST на `NADIN_HEALTH_API_URL/api/trpc/<procedurePath>` с заголовком `X-Service-Token: NADIN_HEALTH_SERVICE_TOKEN` и телом `{ "json": { telegramUserId, ... } }`);
- перед ответом пользователю собирает контекст из ответов API в читаемый текст и передаёт его в LLM;
- не выдумывает данные — только то, что пришло из API или из сообщения пользователя; перед отправкой ответ проверяется на выдуманные медицинские факты.

## Переменные окружения

- `NADIN_HEALTH_API_URL` — базовый URL (например https://itresolver.ru, без слеша в конце).
- `NADIN_HEALTH_SERVICE_TOKEN` — секрет из nadin-health (заголовок X-Service-Token).

Если в nadin-health задана переменная `ALLOWED_TELEGRAM_USER_IDS` (через запятую, например `123456789,987654321`), API принимает запросы только для этих пользователей. Остальные получат ответ 403. По желанию в агенте можно до вызова API проверять `message.from.id` по этому списку и не вызывать API для посторонних (или отправить сообщение «бот недоступен»).

## Карта действий (action → tRPC procedure)

- checkProfile → user.isProfileComplete
- saveProfile → user.upsertProfile
- saveDailyLog → healthLog.upsertDailyLogForTelegramUser
- getDailyLog → healthLog.getDailyLogForTelegramUser
- listDailyLogs → healthLog.listDailyLogsForTelegramUser
- getSummary → healthLog.summaryForTelegramUser
- getReport → healthLog.reportForTelegramUser
- addLabResult → labResult.addForTelegramUser
- listLabResults → labResult.listForTelegramUser
- addBodyMeasurement → bodyMeasurement.addForTelegramUser
- listBodyMeasurements → bodyMeasurement.listForTelegramUser
- addMedicationPlan → medicationPlan.addForTelegramUser
- listMedicationPlans → medicationPlan.listForTelegramUser
- addLabPanel → labPanel.addForTelegramUser
- listLabPanels → labPanel.listForTelegramUser

Во все вызовы передавать `telegramUserId` из `message.from.id`.

## Pipeline обработки сообщения

1. Определить намерение (intent): chat | log_food | log_water | log_sleep | log_activity | add_measurement | report | profile_update | lab_result | medication.
2. При необходимости извлечь из текста структуру (waterMl, sleepStart, sleepEnd, mealDescription, calories, proteinG, fatG, carbsG и т.д.).
3. Загрузить последние сообщения из памяти чата и факты пользователя.
4. Вызвать нужный tool через POST на `${NADIN_HEALTH_API_URL}/api/trpc/${route}` с телом `{ "json": payload }` и заголовком `X-Service-Token`.
5. Преобразовать ответ API в краткий текстовый контекст (возраст, вес, цель, последние дни: сон, вода, активность и т.д.).
6. Вызвать LLM с системным промптом + контекст + история + сообщение пользователя.
7. Проверить ответ: нет ли выдуманных медицинских фактов; при необходимости переписать.
8. Сохранить сообщения в память чата и отправить ответ в Telegram.

## Правило grounding

В системном промпте должно быть: «Используй только данные из DATA CONTEXT. Если информации нет — скажи, что данных недостаточно. Не придумывай показатели.»

## Память

- Краткосрочная: таблица chat_memory (telegram_user_id, role, content, created_at) — последние N сообщений перед вызовом LLM.
- Долгосрочная: таблица user_facts (telegram_user_id, key, value) — имя, цель, диета и т.д.

## Даты

Пользователю показывать даты в формате ДД-ММ-ГГГГ (русская локаль). В API использовать YYYY-MM-DD.

Полное описание API и примеры тел запросов — в документации nadin-health, файл OPENCLAW-SETUP.md.
