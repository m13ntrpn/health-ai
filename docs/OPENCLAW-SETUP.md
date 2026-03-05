# Настройка OpenClaw для nadin-health

## Архитектура

OpenClaw получает сообщения из Telegram, передаёт их в LLM (OpenRouter) вместе с системным промптом и описанием инструментов. LLM решает, какой tool вызвать, OpenClaw делает HTTP-запрос к nadin-health API и возвращает ответ пользователю.

nadin-health — только хранилище данных. Весь диалог, тон, логика — на стороне OpenClaw/LLM.

---

## Обязательные заголовки для каждого запроса к API

```
X-Service-Token: <значение SERVICE_API_TOKEN из .env>
Content-Type: application/json
```

Каждый tool передаёт `telegramUserId` = `message.from.id` из Telegram update.

---

## Базовый URL

```
https://<ваш-домен>/api/trpc
```

Для проверки доступности: `GET https://<ваш-домен>/api/health` → `{ "ok": true }`

---

## Tools (function calling)

### `checkProfile` — проверить заполненность анкеты

```json
{
  "name": "checkProfile",
  "description": "Проверить, заполнил ли пользователь анкету. Вызывать при первом сообщении или /start.",
  "parameters": {
    "telegramUserId": "string"
  }
}
```

tRPC endpoint: `POST /api/trpc/user.isProfileComplete`

```json
{
  "json": { "telegramUserId": "123456789" }
}
```

Ответ:
```json
{ "result": { "data": { "json": { "isComplete": false, "missingFields": ["возраст", "пол", "рост", "вес", "цель"] } } } }
```

---

### `saveProfile` — сохранить данные анкеты

```json
{
  "name": "saveProfile",
  "description": "Сохранить или обновить данные анкеты пользователя.",
  "parameters": {
    "telegramUserId": "string",
    "payload": {
      "age": "number (опционально)",
      "sex": "male | female | other (опционально)",
      "heightCm": "number (опционально)",
      "weightKg": "number (опционально)",
      "waistCm": "number (опционально)",
      "hipsCm": "number (опционально)",
      "bodyFatPercent": "number (опционально)",
      "activityLevel": "low | medium | high (опционально)",
      "conditions": "string — хронические заболевания (опционально)",
      "goals": "string — цель пользователя (опционально)"
    }
  }
}
```

tRPC endpoint: `POST /api/trpc/user.upsertProfile`

---

### `saveDailyLog` — записать данные за день

```json
{
  "name": "saveDailyLog",
  "description": "Записать или обновить дневник здоровья за конкретный день.",
  "parameters": {
    "telegramUserId": "string",
    "date": "YYYY-MM-DD",
    "payload": {
      "mood": "string (опционально)",
      "comment": "string (опционально)",
      "isCompleted": "boolean (опционально)",
      "waterMl": "number — мл воды за день (опционально)",
      "meals": [{ "type": "breakfast|lunch|dinner|snack|other", "description": "string", "calories": "number", "proteinG": "number", "fatG": "number", "carbsG": "number" }],
      "sleepLogs": [{ "start": "ISO datetime", "end": "ISO datetime", "quality": "great|good|ok|poor|terrible" }],
      "activityLogs": [{ "type": "string", "durationMin": "number", "intensity": "low|medium|high" }],
      "intakes": [{ "name": "string", "dose": "string", "category": "vitamin|medicine|other" }]
    }
  }
}
```

tRPC endpoint: `POST /api/trpc/healthLog.upsertDailyLogForTelegramUser`

---

### `getDailyLog` — получить лог за день

tRPC endpoint: `POST /api/trpc/healthLog.getDailyLogForTelegramUser`

```json
{ "json": { "telegramUserId": "123456789", "date": "2026-03-05" } }
```

---

### `getSummary` — числовая сводка за период

tRPC endpoint: `POST /api/trpc/healthLog.summaryForTelegramUser`

```json
{ "json": { "telegramUserId": "123456789", "fromDate": "2026-02-01", "toDate": "2026-02-28" } }
```

Ответ: `{ "totalCalories": 42000, "completedDaysCount": 18, "daysWithLogsCount": 22 }`

---

### `getReport` — LLM-отчёт с советами

tRPC endpoint: `POST /api/trpc/healthLog.reportForTelegramUser`

```json
{ "json": { "telegramUserId": "123456789", "fromDate": "2026-02-01", "toDate": "2026-02-28" } }
```

Ответ — агрегированный контекст, который нужно передать в LLM:

```json
{
  "period": { "from": "2026-02-01", "to": "2026-02-28", "daysWithLogs": 10, "completedDays": 7 },
  "nutrition": {
    "totalCalories": 21000,
    "avgCaloriesPerDay": 2100,
    "totalProteinG": 700,
    "totalFatG": 500,
    "totalCarbsG": 2500,
    "totalWaterMl": 18000,
    "avgWaterMlPerDay": 1800
  },
  "sleep": { "avgHoursPerNight": 7.5 },
  "activity": { "totalMinutes": 600, "avgMinPerDay": 60 },
  "profile": {
    "age": 35,
    "sex": "male",
    "heightCm": 180,
    "weightKg": 80,
    "goals": "похудеть на 5 кг",
    "conditions": null,
    "activityLevel": "medium"
  }
}
```

---

### `addLabResult` — добавить результат анализа

tRPC endpoint: `POST /api/trpc/labResult.addForTelegramUser`

```json
{
  "json": {
    "telegramUserId": "123456789",
    "payload": {
      "type": "blood",
      "date": "2026-03-01T00:00:00.000Z",
      "title": "Общий анализ крови",
      "rawSummary": "Гемоглобин 130, лейкоциты 6.2..."
    }
  }
}
```

---

## Системный промпт

Вставь этот промпт в настройки OpenClaw как системный. Отредактируй под себя.

```
Ты заботливый и дружелюбный персональный помощник по здоровью. Твоя задача — помогать пользователю следить за здоровьем, питанием, сном и активностью.

ТОНАЛЬНОСТЬ:
- Всегда тёплый, поддерживающий, без осуждения.
- Если пользователь не выполнил цель — мягко поддержи, не критикуй.
- Если есть прогресс — искренне похвали.
- Пиши по-русски, простым языком.

ПЕРВОЕ СООБЩЕНИЕ / /start:
1. Вызови checkProfile с telegramUserId пользователя.
2. Если isComplete = false:
   - Поприветствуй тепло: "Привет! Я твой помощник по здоровью 🌿 Чтобы давать точные советы, мне нужно немного узнать тебя."
   - Задавай вопросы по одному, в таком порядке:
     a. "Как тебя зовут?" (сохрани в notes или просто используй в диалоге)
     b. "Сколько тебе лет?"
     c. "Какой у тебя рост и текущий вес?"
     d. "Есть ли у тебя какая-то цель? Например, похудеть на 5 кг, улучшить сон, следить за питанием..."
     e. "Есть ли хронические заболевания или ограничения, о которых мне стоит знать?" (можно пропустить)
   - После каждого ответа — сохраняй через saveProfile.
3. Если isComplete = true — просто поздоровайся и спроси как дела / что записать сегодня.

ЕЖЕДНЕВНОЕ ИСПОЛЬЗОВАНИЕ:
- Если пользователь описывает что ел — запрашивай недостающие данные (калории, КБЖУ) и сохраняй через saveDailyLog.
- Если пишет про сон — сохраняй время начала/конца и качество.
- Если пишет про тренировку — сохраняй тип, длительность, интенсивность.
- Если пишет про воду — сохраняй waterMl.
- Если пишет про витамины или лекарства — сохраняй в intakes.
- Если упоминает анализы — сохраняй через addLabResult.

ОТЧЁТЫ:
- Если пользователь просит отчёт / "как я за неделю?" / "что думаешь о моём питании?" — вызови `getReport` с нужным периодом, передай полученный JSON-контекст в LLM и сформируй дружелюбный ответ с советами.
- Для быстрой числовой статистики (без советов) — используй `getSummary`.

ВАЖНО:
- Всегда передавай telegramUserId пользователя в каждый вызов инструмента.
- Дату используй в формате YYYY-MM-DD. Сегодняшняя дата доступна в контексте.
- Не выдумывай данные — только то, что сказал пользователь.
```

---

## Переменные окружения nadin-health

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SERVICE_API_TOKEN` | Токен, который OpenClaw передаёт в `X-Service-Token` |
| `DEFAULT_TELEGRAM_USER_ID` | Telegram ID для веб-интерфейса (необязательно) |
