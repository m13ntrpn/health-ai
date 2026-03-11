# nadin-health API — полные примеры payload

Справочник для агента. Читай этот файл только если нужно уточнить структуру конкретного запроса.

---

## 1. checkProfile
```
bash {baseDir}/nadin.sh user.isProfileComplete '{"telegramUserId":"<ID>"}'
```
Ответ: `{ "isComplete": true/false, "missingFields": ["..."] }`

---

## 2. saveProfile
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
Все поля payload опциональны.

---

## 3. saveDailyLog (ВАЖНО: всегда обновляй весь день)
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
        "carbsG": 55,
        "confidenceScore": 0.9
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
}'
```
**КРИТИЧНО:** эта процедура **перезаписывает весь дневник дня**.  
Перед каждым вызовом:

1. Сначала попробуй получить существующий лог за день:
   `healthLog.getDailyLogForTelegramUser (telegramUserId + date)`.
2. На основе ответа обнови объект: добавь/измени приём пищи, воду, сон и т.п., **не теряя уже существующие `meals`, `waterMl`, `sleepLogs`, `activityLogs`, `intakes`**.
3. Вызови `healthLog.upsertDailyLogForTelegramUser` с **полным объединённым объектом за день**, а не только с дельтой.

Если лог за день отсутствует — создай новый `payload` с нуля.

---

## 4. getDailyLog
```
bash {baseDir}/nadin.sh healthLog.getDailyLogForTelegramUser '{"telegramUserId":"<ID>","date":"YYYY-MM-DD"}'
```

---

## 5. listDailyLogs
```
bash {baseDir}/nadin.sh healthLog.listDailyLogsForTelegramUser '{"telegramUserId":"<ID>","limit":10}'
```

---

## 6. getSummary
```
bash {baseDir}/nadin.sh healthLog.summaryForTelegramUser '{"telegramUserId":"<ID>","fromDate":"YYYY-MM-DD","toDate":"YYYY-MM-DD"}'
```
Ответ: `{ "totalCalories": ..., "completedDaysCount": ..., "daysWithLogsCount": ... }`

---

## 7. getReport
```
bash {baseDir}/nadin.sh healthLog.reportForTelegramUser '{"telegramUserId":"<ID>","fromDate":"YYYY-MM-DD","toDate":"YYYY-MM-DD"}'
```
Ответ содержит: `nutrition`, `sleep`, `activity`, `labs.panels`, `profile`. Пересказывай кратко, не вставляй JSON целиком в ответ пользователю.

---

## 8. addBodyMeasurement
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
Все поля payload опциональны.

---

## 9. listBodyMeasurements
```
bash {baseDir}/nadin.sh bodyMeasurement.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
```

---

## 10. addMedicationPlan
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

## 11. listMedicationPlans
```
bash {baseDir}/nadin.sh medicationPlan.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
```

---

## 12. addLabResult
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

## 13. addLabPanel
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

## 14. listLabs
```
bash {baseDir}/nadin.sh labResult.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
bash {baseDir}/nadin.sh labPanel.listForTelegramUser '{"telegramUserId":"<ID>","limit":20}'
```
