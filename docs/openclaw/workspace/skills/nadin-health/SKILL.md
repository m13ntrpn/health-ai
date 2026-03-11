---
name: nadin-health
description: Хранение и получение данных здоровья пользователя через nadin-health API (питание, сон, активность, замеры, анализы, лекарства, профиль). Вызывать при любых действиях с данными здоровья.
---

# nadin-health API

Вызов: `bash {baseDir}/nadin.sh <procedure> '<json_payload>'`
Всегда передавай `telegramUserId` (числовой ID Telegram как строка). Ответ в `result.data.json`.
Полные примеры payload: `skills/nadin-health/SKILL-REFERENCE.md`.

## Процедуры

| # | Имя | Процедура | Когда |
|---|-----|-----------|-------|
| 1 | checkProfile | `user.isProfileComplete` | `/start`, первое сообщение |
| 2 | saveProfile | `user.upsertProfile` | заполнение анкеты |
| 3 | saveDailyLog | `healthLog.upsertDailyLogForTelegramUser` | еда/вода/сон/активность/таблетки |
| 4 | getDailyLog | `healthLog.getDailyLogForTelegramUser` | лог за конкретный день |
| 5 | listDailyLogs | `healthLog.listDailyLogsForTelegramUser` | список логов |
| 6 | getSummary | `healthLog.summaryForTelegramUser` | быстрая числовая сводка за период |
| 7 | getReport | `healthLog.reportForTelegramUser` | детальный отчёт (nutrition/sleep/activity/labs) |
| 8 | addBodyMeasurement | `bodyMeasurement.addForTelegramUser` | вес, объёмы, % жира |
| 9 | listBodyMeasurements | `bodyMeasurement.listForTelegramUser` | история замеров |
| 10 | addMedicationPlan | `medicationPlan.addForTelegramUser` | постоянный препарат/добавка |
| 11 | listMedicationPlans | `medicationPlan.listForTelegramUser` | список постоянных препаратов |
| 12 | addLabResult | `labResult.addForTelegramUser` | анализы в свободной форме |
| 13 | addLabPanel | `labPanel.addForTelegramUser` | структурированные анализы с референсами |
| 14 | listLabs | `labResult.listForTelegramUser` / `labPanel.listForTelegramUser` | список анализов |
