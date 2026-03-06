# Настройка OpenClaw для nadin-health

## Архитектура

OpenClaw получает сообщения из Telegram, передаёт их в LLM (OpenRouter) вместе с системным промптом и описанием инструментов. LLM решает, какой tool вызвать, OpenClaw делает HTTP-запрос к nadin-health API и возвращает ответ пользователю.

nadin-health — только хранилище данных. Весь диалог, тон, логика — на стороне OpenClaw/LLM.

---

## Пошаговая настройка OpenClaw на сервере

Tools для LLM (function calling) **не настраиваются через веб-интерфейс** — их задают в конфигурационном файле или в коде проекта OpenClaw на сервере. Ниже пошаговый план.

### Шаг 1. Проверка nadin-health

Убедись, что API nadin-health доступен с хоста, где крутится OpenClaw:

```bash
curl -s https://<ваш-домен>/api/health
```

Ожидается ответ: `{"ok":true}`.

Проверь, что в окружении nadin-health (например в `.env.prod` на сервере) задан `SERVICE_API_TOKEN`. Этот же токен OpenClaw будет передавать в заголовке `X-Service-Token` при каждом запросе к API.

### Шаг 2. Где настраивать OpenClaw (без dashboard)

- **Переменные окружения** — задай в одном месте:
  - `NADIN_HEALTH_API_URL` — базовый URL API (например `https://itresolver.ru`, без завершающего слеша);
  - `NADIN_HEALTH_SERVICE_TOKEN` — значение `SERVICE_API_TOKEN` из nadin-health.
- **Список tools** — в конфиге или в коде OpenClaw, где формируется список инструментов для провайдера (OpenRouter): описание каждого tool (имя, description, parameters в формате, который ожидает OpenRouter) и при выборе LLM этого tool — выполнение HTTP-запроса к nadin-health (см. шаг 3 и раздел «Формат вызова tRPC» ниже).

Рекомендуется во всех запросах к API использовать:

- URL: `POST ${NADIN_HEALTH_API_URL}/api/trpc/<procedurePath>` (подставить путь процедуры, например `user.isProfileComplete` или `healthLog.reportForTelegramUser`);
- Заголовки: `Content-Type: application/json`, `X-Service-Token: ${NADIN_HEALTH_SERVICE_TOKEN}`;
- Тело: JSON с полем `json` — вход процедуры (см. примеры по каждому tool ниже).

### Шаг 3. Добавление tools

Для каждого tool нужно:

1. **Описание для LLM** — имя, описание, схема параметров (JSON), как в разделе «Tools (function calling)» ниже. Этот блок передаётся в OpenRouter при вызове LLM.
2. **Реализация вызова** — когда LLM выбирает tool и возвращает аргументы, выполнить `POST https://<домен>/api/trpc/<procedurePath>` с заголовками выше и телом `{ "json": { ... } }`, где `...` — объект из раздела «Пример тела» для данной процедуры (подставить `telegramUserId` из `message.from.id` и остальные параметры из ответа LLM).

В этом документе для каждой процедуры указаны: имя tool, описание, параметры и пример тела запроса — можно копировать в конфиг/код OpenClaw.

### Шаг 4. Проверка вызова API с сервера

С хоста, где запущен OpenClaw, выполни (подставь свой домен и токен):

```bash
# Проверка доступности
curl -s https://<домен>/api/health

# Пример вызова процедуры (checkProfile)
curl -s -X POST "https://<домен>/api/trpc/user.isProfileComplete" \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: <твой SERVICE_API_TOKEN>" \
  -d '{"json":{"telegramUserId":"123456789"}}'
```

Ответ будет в формате tRPC (обёрнут в `result.data.json` и т.п.). Если видишь данные (например `isComplete`, `missingFields`) — интеграция работает.

### Шаг 5. Системный промпт

Вставь блок «Системный промпт» из этого же документа в настройки OpenClaw — в тот файл или переменную окружения, где задаётся system prompt для OpenRouter. Даты пользователю в ответах выводи в формате ДД-ММ-ГГГГ (русская локаль).

---

## Обязательные заголовки для каждого запроса к API

```
X-Service-Token: <значение SERVICE_API_TOKEN из .env>
Content-Type: application/json
```

Каждый tool передаёт `telegramUserId` = `message.from.id` из Telegram update.

---

## Базовый URL и формат вызова tRPC

- Базовый URL: `https://<ваш-домен>/api/trpc`
- Проверка доступности: `GET https://<ваш-домен>/api/health` → `{ "ok": true }`

**Формат вызова одной процедуры:**  
`POST https://<ваш-домен>/api/trpc/<procedurePath>`

Путь процедуры (`procedurePath`) — в URL. Примеры: `user.isProfileComplete`, `healthLog.upsertDailyLogForTelegramUser`, `healthLog.reportForTelegramUser`.

Тело запроса — JSON с одним полем `json`, в котором объект ввода процедуры:

```json
{ "json": { "telegramUserId": "123456789", ... } }
```

Ответ приходит в обёртке tRPC; нужные данные — в `result.data.json` (или по структуре ответа вашего клиента).

---

## Tools (function calling)

### `checkProfile` — проверить заполненность анкеты

Проверить, заполнил ли пользователь анкету. Вызывать при первом сообщении или /start.

**Параметры:** `telegramUserId` (string).

**Процедура:** `user.isProfileComplete`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789" } }
```

**Пример ответа:** `{ "result": { "data": { "json": { "isComplete": false, "missingFields": ["дата рождения", "пол", "рост", "вес"] } } } }`

---

### `saveProfile` — сохранить данные анкеты

Сохранить или обновить данные анкеты пользователя.

**Параметры:** `telegramUserId` (string), `payload` (object, все поля опциональны):

- `birthDate` — дата рождения (YYYY-MM-DD или ISO строка);
- `sex` — `"male"` | `"female"` | `"other"`;
- `heightCm` — число;
- `weightKg`, `waistCm`, `hipsCm`, `bodyFatPercent`, `muscleMassKg`, `bodyWaterPercent` — числа;
- `activityLevel` — `"low"` | `"medium"` | `"high"`;
- `countryCode` — строка 2 символа (ISO код страны);
- `timezone` — строка (IANA, например Europe/Moscow);
- `bloodType` — `"A"` | `"B"` | `"AB"` | `"O"`; `rhFactor` — `"+"` | `"-"`;
- `restingHeartRateBpm`, `bloodPressureSys`, `bloodPressureDia` — числа;
- `smokingStatus` — `"never"` | `"former"` | `"current"`;
- `alcoholUse` — `"none"` | `"rare"` | `"moderate"` | `"high"`;
- `conditions`, `allergies`, `intolerances`, `dietType`, `goals` — строки (свободный текст);
- `targetWeightKg`, `targetCalories`, `targetProteinG`, `targetFatG`, `targetCarbsG`, `targetWaterMl`, `targetSteps` — числа;
- `bmrCalories`, `tdeeCalories` — числа.

**Процедура:** `user.upsertProfile`

**Пример тела запроса:**

```json
{
  "json": {
    "telegramUserId": "123456789",
    "payload": {
      "birthDate": "1990-05-15",
      "sex": "male",
      "heightCm": 180,
      "weightKg": 80,
      "goals": "похудеть на 5 кг",
      "activityLevel": "medium"
    }
  }
}
```

---

### `saveDailyLog` — записать данные за день

Записать или обновить дневник здоровья за конкретный день.

**Параметры:** `telegramUserId` (string), `date` (YYYY-MM-DD), `payload` (object):

- `mood`, `comment` — строки (опционально);
- `isCompleted` — boolean (опционально);
- `waterMl` — число, мл воды за день (опционально);
- `energyLevel` — число 1–5 (опционально);
- `stressLevel` — число 1–5 (опционально);
- `meals` — массив: `type` (breakfast|lunch|dinner|snack|other), `time` (ISO datetime), `description`, `calories`, `proteinG`, `fatG`, `carbsG`, `confidenceScore` (0–1, опционально);
- `sleepLogs` — массив: `start`, `end` (ISO datetime), `quality` (строка);
- `activityLogs` — массив: `type` (строка), `durationMin` (число), `intensity` (low|medium|high);
- `intakes` — массив: `name` (строка), `dose`, `time` (ISO), `category` (vitamin|medicine|other).

**Процедура:** `healthLog.upsertDailyLogForTelegramUser`

**Пример тела запроса:**

```json
{
  "json": {
    "telegramUserId": "123456789",
    "date": "2026-03-06",
    "payload": {
      "waterMl": 2000,
      "meals": [
        { "type": "breakfast", "description": "Овсянка, кофе", "calories": 350, "proteinG": 12, "fatG": 8, "carbsG": 50 }
      ],
      "sleepLogs": [{ "start": "2026-03-06T00:00:00.000Z", "end": "2026-03-06T07:30:00.000Z", "quality": "good" }],
      "activityLogs": [{ "type": "walking", "durationMin": 30, "intensity": "medium" }],
      "intakes": [{ "name": "Витамин D", "dose": "2000 ME", "category": "vitamin" }]
    }
  }
}
```

---

### `getDailyLog` — получить лог за день

**Параметры:** `telegramUserId`, `date` (YYYY-MM-DD).

**Процедура:** `healthLog.getDailyLogForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "date": "2026-03-05" } }
```

---

### `listDailyLogs` — список логов с пагинацией

**Параметры:** `telegramUserId`, `limit` (число, по умолчанию 20), `cursor` (строка, опционально).

**Процедура:** `healthLog.listDailyLogsForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "limit": 10 } }
```

---

### `getSummary` — числовая сводка за период

**Параметры:** `telegramUserId`, `fromDate`, `toDate` (YYYY-MM-DD).

**Процедура:** `healthLog.summaryForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "fromDate": "2026-02-01", "toDate": "2026-02-28" } }
```

**Пример ответа:** `{ "totalCalories": 42000, "completedDaysCount": 18, "daysWithLogsCount": 22 }`

---

### `getReport` — контекст для LLM-отчёта

Вернуть агрегированный контекст за период; передать этот JSON в LLM и сформировать дружелюбный ответ с советами.

**Параметры:** `telegramUserId`, `fromDate`, `toDate` (YYYY-MM-DD).

**Процедура:** `healthLog.reportForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "fromDate": "2026-02-01", "toDate": "2026-02-28" } }
```

**Пример ответа (структура):**

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
  "activity": {
    "totalMinutes": 600,
    "avgMinPerDay": 60,
    "avgEnergyLevel": 4.2,
    "avgStressLevel": 2.1
  },
  "labs": {
    "panels": [
      {
        "id": "panel-id",
        "name": "Общий анализ крови",
        "type": "blood",
        "date": "2026-02-15",
        "metrics": [
          { "code": "HGB", "name": "Гемоглобин", "value": 145, "unit": "g/L", "refLow": 130, "refHigh": 160, "flag": "normal" }
        ]
      }
    ]
  },
  "profile": {
    "birthDate": "1990-05-15",
    "ageYears": 35,
    "sex": "male",
    "heightCm": 180,
    "weightKg": 80,
    "goals": "похудеть на 5 кг",
    "conditions": null,
    "activityLevel": "medium",
    "countryCode": "RU",
    "timezone": "Europe/Moscow",
    "bloodType": "A",
    "rhFactor": "+",
    "restingHeartRateBpm": 65,
    "bloodPressureSys": 120,
    "bloodPressureDia": 80,
    "smokingStatus": "never",
    "alcoholUse": "rare",
    "allergies": null,
    "intolerances": null,
    "dietType": null,
    "targets": {
      "targetWeightKg": 75,
      "targetCalories": 2000,
      "targetProteinG": 120,
      "targetFatG": 65,
      "targetCarbsG": 220,
      "targetWaterMl": 2000,
      "targetSteps": 10000
    },
    "metabolism": { "bmrCalories": 1800, "tdeeCalories": 2200 },
    "onboardingCompleted": true
  }
}
```

---

### `addLabResult` — добавить результат анализа (сырой текст)

**Параметры:** `telegramUserId`, `payload`: `type` (строка, например blood/urine), `date` (ISO), `title`, `rawSummary` (текст).

**Процедура:** `labResult.addForTelegramUser`

**Пример тела запроса:**

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

### `listLabResults` — список сырых результатов анализов

**Параметры:** `telegramUserId`, `limit` (по умолчанию 20), `cursor` (опционально).

**Процедура:** `labResult.listForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "limit": 20 } }
```

---

### `addBodyMeasurement` — добавить замер тела

Использовать, когда пользователь сообщает вес, объёмы, % жира и т.п. (история измерений для графиков и трендов).

**Параметры:** `telegramUserId`, `payload` (все поля опциональны, кроме привязки к пользователю): `measuredAt` (ISO datetime), `weightKg`, `waistCm`, `hipsCm`, `bodyFatPercent`, `muscleMassKg`, `bodyWaterPercent`.

**Процедура:** `bodyMeasurement.addForTelegramUser`

**Пример тела запроса:**

```json
{
  "json": {
    "telegramUserId": "123456789",
    "payload": {
      "measuredAt": "2026-03-06T10:00:00.000Z",
      "weightKg": 79.5,
      "waistCm": 88,
      "bodyFatPercent": 22,
      "bodyWaterPercent": 55
    }
  }
}
```

---

### `listBodyMeasurements` — список замеров тела

**Параметры:** `telegramUserId`, `limit`, `cursor` (опционально).

**Процедура:** `bodyMeasurement.listForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "limit": 20 } }
```

---

### `addMedicationPlan` — добавить постоянный препарат

Использовать для хронических лекарств/витаминов, которые пользователь принимает по расписанию (не разовый приём в дневнике).

**Параметры:** `telegramUserId`, `payload`: `name` (строка, обязательно), `dose`, `schedule` (текст, например «1 раз утром»), `startDate`, `endDate` (ISO даты, опционально).

**Процедура:** `medicationPlan.addForTelegramUser`

**Пример тела запроса:**

```json
{
  "json": {
    "telegramUserId": "123456789",
    "payload": {
      "name": "Омега-3",
      "dose": "1000 мг",
      "schedule": "1 капсула утром",
      "startDate": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

---

### `listMedicationPlans` — список постоянных препаратов

**Параметры:** `telegramUserId`, `limit`, `cursor` (опционально).

**Процедура:** `medicationPlan.listForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "limit": 20 } }
```

---

### `addLabPanel` — добавить структурированную панель анализов

Использовать, когда есть расшифровка анализов по показателям (код, название, значение, референс, флаг). Удобно для умного анализа и трендов.

**Параметры:** `telegramUserId`, `payload`: `name` (название панели), `type` (например blood, urine), `date` (ISO), `labResultId` (опционально, связь с сырым LabResult), `metrics` — массив: `code` (например HGB, GLU), `name`, `value`, `unit`, `refLow`, `refHigh`, `flag` (low|high|normal).

**Процедура:** `labPanel.addForTelegramUser`

**Пример тела запроса:**

```json
{
  "json": {
    "telegramUserId": "123456789",
    "payload": {
      "name": "Общий анализ крови",
      "type": "blood",
      "date": "2026-03-01T00:00:00.000Z",
      "metrics": [
        { "code": "HGB", "name": "Гемоглобин", "value": 145, "unit": "g/L", "refLow": 130, "refHigh": 160, "flag": "normal" },
        { "code": "GLU", "name": "Глюкоза", "value": 5.2, "unit": "mmol/L", "refLow": 3.9, "refHigh": 6.1, "flag": "normal" }
      ]
    }
  }
}
```

---

### `listLabPanels` — список структурированных панелей анализов

**Параметры:** `telegramUserId`, `limit`, `cursor` (опционально).

**Процедура:** `labPanel.listForTelegramUser`

**Пример тела запроса:**

```json
{ "json": { "telegramUserId": "123456789", "limit": 20 } }
```

---

## Системный промпт

Вставь этот промпт в настройки OpenClaw как системный. Отредактируй под себя. Даты в ответах пользователю выводи в формате ДД-ММ-ГГГГ.

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
   - Поприветствуй тепло: "Привет! Я твой помощник по здоровью. Чтобы давать точные советы, мне нужно немного узнать тебя."
   - Задавай вопросы по одному, в таком порядке:
     a. "Как тебя зовут?" (сохрани в notes или просто используй в диалоге)
     b. "Какая у тебя дата рождения? (в формате ДД-ММ-ГГГГ)"
     c. "Какой у тебя рост и текущий вес?"
     d. "Есть ли у тебя какая-то цель? Например, похудеть на 5 кг, улучшить сон, следить за питанием..."
     e. "Есть ли хронические заболевания или ограничения, о которых мне стоит знать?" (можно пропустить)
   - После каждого ответа — сохраняй через saveProfile (дату рождения передавай в birthDate в формате YYYY-MM-DD).
3. Если isComplete = true — просто поздоровайся и спроси как дела / что записать сегодня.

ЕЖЕДНЕВНОЕ ИСПОЛЬЗОВАНИЕ:
- Если пользователь описывает что ел — запрашивай недостающие данные (калории, КБЖУ) и сохраняй через saveDailyLog.
- Если пишет про сон — сохраняй время начала/конца и качество в sleepLogs.
- Если пишет про тренировку — сохраняй тип, длительность, интенсивность в activityLogs.
- Если пишет про воду — сохраняй waterMl. Если сообщает уровень энергии или стресса (1–5) — сохраняй energyLevel, stressLevel.
- Если пишет про витамины или разовые лекарства — сохраняй в intakes в saveDailyLog.
- Если сообщает постоянный приём лекарства/добавки — добавляй через addMedicationPlan.
- Если упоминает анализы в свободной форме — сохраняй через addLabResult. Если пользователь или ты разбираешь показатели по пунктам (гемоглобин, глюкоза и т.д.) — используй addLabPanel.
- Если пользователь сообщает замеры тела (вес, объёмы, % жира) — сохраняй через addBodyMeasurement.

ОТЧЁТЫ:
- Если пользователь просит отчёт / "как я за неделю?" / "что думаешь о моём питании?" — вызови getReport с нужным периодом, передай полученный JSON-контекст в LLM и сформируй дружелюбный ответ с советами. В контексте есть nutrition, sleep, activity (в т.ч. avgEnergyLevel, avgStressLevel), labs.panels (если есть структурированные анализы), profile (в т.ч. birthDate, ageYears, targets).
- Для быстрой числовой статистики (без советов) — используй getSummary.

ВАЖНО:
- Всегда передавай telegramUserId пользователя в каждый вызов инструмента.
- Даты в API используй в формате YYYY-MM-DD; пользователю в ответах показывай даты в формате ДД-ММ-ГГГГ.
- Не выдумывай данные — только то, что сказал пользователь.
```

---

## Переменные окружения

### nadin-health (сервер приложения)

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SERVICE_API_TOKEN` | Токен, который OpenClaw передаёт в `X-Service-Token` |
| `DEFAULT_TELEGRAM_USER_ID` | Telegram ID для веб-интерфейса (необязательно) |

### OpenClaw (сервер бота)

Задай в окружении или конфиге проекта OpenClaw:

| Переменная | Описание |
|------------|----------|
| `NADIN_HEALTH_API_URL` | Базовый URL API (например `https://itresolver.ru`) |
| `NADIN_HEALTH_SERVICE_TOKEN` | То же значение, что `SERVICE_API_TOKEN` в nadin-health; подставляется в заголовок `X-Service-Token` при запросах к API |
