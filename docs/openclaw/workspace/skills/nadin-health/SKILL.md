---
name: nadin-health
description: Хранение и получение данных здоровья пользователя через nadin-health API (питание, сон, активность, замеры, анализы, лекарства, профиль). Вызывать при любых действиях с данными здоровья.
---

# nadin-health API

Все данные хранятся в nadin-health API (tRPC over HTTP).
Исполняй через `bash {baseDir}/nadin.sh <procedure> '<json_payload>'`.

**Обязательно**: во все вызовы передавай `telegramUserId` — числовой Telegram ID отправителя как строка (из контекста разговора).

Ответ приходит в обёртке tRPC. Данные находятся в `result.data.json`. Если в ответе `error` — сообщи пользователю понятно, без технических деталей.

---

## Доступные процедуры

### 1. checkProfile — проверить анкету
Вызывать при первом сообщении или /start.
```
bash {baseDir}/nadin.sh user.isProfileComplete '{"telegramUserId":"<ID>"}'
```
Ответ: `{ "isComplete": true/false, "missingFields": ["..."] }`

---

### 2. saveProfile — сохранить анкету
```
bash {baseDir}/nadin.sh user.upsertProfile '{
  "telegramUserId": "<ID>",
  "payload": {
    "birthDate": "YYYY-MM-DD",
    "sex": "male|female|other",
    "heightCm": 180,
    "weightKg": 80,
    "goals": "текст цели",
    "activityLevel": "low|medium|high",
    "conditions": "хронические заболевания",
    "allergies": "аллергии",
    "timezone": "Europe/Moscow",
    "targetWeightKg": 75,
    "targetCalories": 2000,
    "targetWaterMl": 2000
  }
}'
```
Все поля payload опциональны — передавай только те, что есть.

---

### 3. saveDailyLog — записать данные за день
```
bash {baseDir}/nadin.sh healthLog.upsertDailyLogForTelegramUser '{
  "telegramUserId": "<ID>",
  "date": "YYYY-MM-DD",
  "payload": {
    "waterMl": 2000,
    "mood": "хорошее",
    "energyLevel": 4,
    "stressLevel": 2,
    "meals": [
      {
        "type": "breakfast|lunch|dinner|snack|other",
        "description": "Овсянка с бананом",
        "calories": 350,
        "proteinG": 12,
        "fatG": 6,
        "carbsG": 55
      }
    ],
    "sleepLogs": [
      {
        "start": "2026-03-05T23:00:00.000Z",
        "end": "2026-03-06T07:30:00.000Z",
        "quality": "хорошее"
      }
    ],
    "activityLogs": [
      {
        "type": "walking",
        "durationMin": 30,
        "intensity": "low|medium|high"
      }
    ],
    "intakes": [
      {
        "name": "Витамин D",
        "dose": "2000 МЕ",
        "category": "vitamin|medicine|other"
      }
    ]
  }
}'
```
Все поля payload опциональны. Передавай только то, что упомянул пользователь.

---

### 4. getDailyLog — получить лог за день
```
bash {baseDir}/nadin.sh healthLog.getDailyLogForTelegramUser '{"telegramUserId":"<ID>","date":"YYYY-MM-DD"}'
```

---

### 5. listDailyLogs — список логов
```
bash {baseDir}/nadin.sh healthLog.listDailyLogsForTelegramUser '{"telegramUserId":"<ID>","limit":10}'
```

---

### 6. getSummary — числовая сводка за период
```
bash {baseDir}/nadin.sh healthLog.summaryForTelegramUser '{"telegramUserId":"<ID>","fromDate":"YYYY-MM-DD","toDate":"YYYY-MM-DD"}'
```
Ответ: `{ "totalCalories": ..., "completedDaysCount": ..., "daysWithLogsCount": ... }`

---

### 7. getReport — полный контекст для отчёта (передать в LLM)
```
bash {baseDir}/nadin.sh healthLog.reportForTelegramUser '{"telegramUserId":"<ID>","fromDate":"YYYY-MM-DD","toDate":"YYYY-MM-DD"}'
```
Ответ содержит: `nutrition`, `sleep`, `activity`, `labs.panels`, `profile`.
Передай этот JSON как контекст и сформируй дружелюбный ответ с советами.

---

### 8. addBodyMeasurement — замер тела
```
bash {baseDir}/nadin.sh bodyMeasurement.addForTelegramUser '{
  "telegramUserId": "<ID>",
  "payload": {
    "measuredAt": "2026-03-06T10:00:00.000Z",
    "weightKg": 79.5,
    "waistCm": 88,
    "hipsCm": 96,
    "bodyFatPercent": 22,
    "muscleMassKg": 35,
    "bodyWaterPercent": 55
  }
}'
```
Все поля кроме привязки к пользователю опциональны. Передавай только то, что назвал пользователь.

---

### 9. listBodyMeasurements — список замеров тела
```
bash {baseDir}/nadin.sh bodyMeasurement.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
```

---

### 10. addMedicationPlan — постоянный препарат (курс)
Для хронических лекарств и добавок, которые принимаются регулярно (не разовый приём).
```
bash {baseDir}/nadin.sh medicationPlan.addForTelegramUser '{
  "telegramUserId": "<ID>",
  "payload": {
    "name": "Омега-3",
    "dose": "1000 мг",
    "schedule": "1 капсула утром",
    "startDate": "2026-01-01T00:00:00.000Z"
  }
}'
```

---

### 11. listMedicationPlans — список постоянных препаратов
```
bash {baseDir}/nadin.sh medicationPlan.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
```

---

### 12. addLabResult — анализы в свободной форме (сырой текст)
```
bash {baseDir}/nadin.sh labResult.addForTelegramUser '{
  "telegramUserId": "<ID>",
  "payload": {
    "type": "blood",
    "date": "2026-03-01T00:00:00.000Z",
    "title": "Общий анализ крови",
    "rawSummary": "Гемоглобин 130, лейкоциты 6.2..."
  }
}'
```

---

### 13. addLabPanel — структурированные анализы (по показателям)
Когда есть конкретные показатели с референсными значениями.
```
bash {baseDir}/nadin.sh labPanel.addForTelegramUser '{
  "telegramUserId": "<ID>",
  "payload": {
    "name": "Общий анализ крови",
    "type": "blood",
    "date": "2026-03-01T00:00:00.000Z",
    "metrics": [
      {
        "code": "HGB",
        "name": "Гемоглобин",
        "value": 145,
        "unit": "g/L",
        "refLow": 130,
        "refHigh": 160,
        "flag": "normal|low|high"
      }
    ]
  }
}'
```

---

### 14. listLabResults и listLabPanels
```
bash {baseDir}/nadin.sh labResult.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
bash {baseDir}/nadin.sh labPanel.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
```
