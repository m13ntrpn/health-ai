# nadin-health — Полный план реализации

## Идея продукта

Персональный ИИ-помощник по здоровью в Telegram. Пользователь ведёт дневник здоровья через бота обычным языком: еда (фото + описание), вода, витамины, сон, активность, анализы. Заполняет анкету (рост, вес, цели). Получает отчёты с КБЖУ, показателями, динамикой и дружелюбными советами с учётом цели.

**Ключевые принципы:**
- Никаких кнопок в боте — только естественный диалог через OpenClaw + LLM
- nadin-health — это API и хранилище данных; вывод текста пользователю делает OpenClaw
- Веб-интерфейс (дашборд, визуализация) — следующий шаг, не текущий приоритет

---

## Стек и архитектура

```
Telegram → OpenClaw (сервер) → OpenRouter LLM → nadin-health API → PostgreSQL
```

- **Frontend**: Next.js 16 (App Router) + TypeScript — веб-интерфейс для просмотра логов и дашборда
- **Backend**: tRPC + Node.js — типизированный API
- **БД**: PostgreSQL + Prisma 7
- **Бот**: Telegram через OpenClaw + OpenRouter (LLM с function calling)
- **Авторизация**: `X-Service-Token` для бота, `DEFAULT_TELEGRAM_USER_ID` для веба

### Поток данных

```
Пользователь пишет в Telegram
  → OpenClaw принимает сообщение
  → Передаёт в LLM (OpenRouter) с системным промптом и описанием tools
  → LLM вызывает нужный tool (upsertDailyLog / getReport / upsertProfile / addLabResult)
  → Запрос к nadin-health API с telegramUserId + X-Service-Token
  → Данные сохраняются в PostgreSQL
  → API возвращает данные в LLM
  → LLM формирует дружелюбный ответ
  → Пользователь получает ответ в Telegram
```

---

## Что уже сделано

### Инфраструктура
- [x] Next.js 16, TypeScript, tRPC, Prisma 7, Docker PostgreSQL (порт 5434)
- [x] Миграции применены, Prisma-клиент сгенерирован в `src/generated/prisma`
- [x] Авторизация: `X-Service-Token` для бота, `DEFAULT_TELEGRAM_USER_ID` для веба
- [x] Логгер, Vitest

### Схема БД — все модели готовы
- [x] `User` (id, role, telegramUserId)
- [x] `UserProfile` (возраст, пол, рост, вес, % жира, цели, диагнозы, уровень активности)
- [x] `DailyLog` (дата, настроение, комментарий, флаг завершения)
- [x] `Meal` (тип, описание, калории, БЖУ)
- [x] `IntakeItem` (витамины, лекарства, доза)
- [x] `SleepLog` (старт, конец, качество)
- [x] `ActivityLog` (тип, длительность, интенсивность)
- [x] `LabResult` (тип, дата, название, сырые данные)
- [x] `FileAsset` (фото еды, анализы)
- [x] `DailySummary` (агрегированные данные дня: КБЖУ, дельты, флаги)

### API для бота (X-Service-Token + telegramUserId)
- [x] `healthLog.getDailyLogForTelegramUser`
- [x] `healthLog.listDailyLogsForTelegramUser`
- [x] `healthLog.upsertDailyLogForTelegramUser` — еда, сон, активность, добавки

### API для веба
- [x] `healthLog.getDailyLog`, `listDailyLogs`, `upsertDailyLog`, `summary`

### Веб-страницы (оставлены как есть, не приоритет)
- [x] Главная, список логов (`/logs`), страница дня (`/logs/[date]`), дашборд (`/dashboard`)
- [x] Форма дня: настроение, комментарий, еда (КБЖУ), сон, активность, добавки

### Тесты
- [x] Агрегация сводки `aggregateLogsToSummary` (7 тестов)
- [x] `ensureUserByTelegramId` с моком Prisma (4 теста)

---

## Что нужно сделать

### 1. Вода — поле `waterMl` в дневном логе

Сейчас нет возможности записать потребление воды.

**Изменения:**
- `prisma/schema.prisma` — добавить `waterMl Int?` в `DailyLog`
- Создать миграцию `add_water_ml_to_daily_log`
- `src/features/health-log/schemas/dailyLog.ts` — добавить `waterMl` в `dailyLogPayloadSchema`
- `src/features/health-log/services/dailyLogService.ts` — передавать `waterMl` в upsert
- `src/features/health-log/components/DailyLogEditor.tsx` — поле ввода воды (мл)

### 2. API профиля пользователя (`UserProfile`)

Модель есть в схеме, но нет ни API, ни UI. Профиль нужен для персонализированных отчётов.

**Новые файлы:**
- `src/features/telegram-user/api/router.ts` — новый роутер `userRouter`
- `src/features/telegram-user/services/userProfileService.ts` — бизнес-логика

**Процедуры:**
- `user.getProfile` — получить профиль по `telegramUserId` (X-Service-Token)
- `user.upsertProfile` — заполнить/обновить: возраст, пол, рост, вес, % жира, цель (`goals`), диагнозы (`conditions`), уровень активности (X-Service-Token)

Подключить `userRouter` в `src/server/api/root.ts`.

### 3. API анализов (`LabResult`)

Пользователь хочет записывать результаты анализов через бота.

**Новые файлы:**
- `src/features/lab-result/api/router.ts` — роутер `labResultRouter`
- `src/features/lab-result/services/labResultService.ts`

**Процедуры:**
- `labResult.upsertForTelegramUser` — добавить/обновить анализ (`type`, `date`, `title`, `rawSummary`)
- `labResult.listForTelegramUser` — список анализов с пагинацией

Подключить в `src/server/api/root.ts`.

### 4. LLM-отчёты и советы (`reportService`)

Главная ценностная функция. Агрегирует данные и запрашивает у LLM дружелюбный отчёт с советами.

**Новый файл:** `src/features/health-log/services/reportService.ts`

**Логика:**
1. Загрузить логи за период + профиль + цель из `UserProfile.goals`
2. Агрегировать: КБЖУ (итого и среднее/день), вода (мл/день), сон (ср. часов), активность (мин/день)
3. Сравнить с нормами или целью
4. Сформировать JSON-контекст и отправить в OpenRouter
5. Вернуть ответ модели пользователю

**Системный промпт** задаёт тон: дружелюбный, с заботой, учитывает цель пользователя:
- Если цель задана → советы по прогрессу к цели
- Если цели нет → мониторинг состояния, предупреждение об ухудшениях

**Новая процедура** в `healthLogRouter`:
```
healthLog.reportForTelegramUser
  Input: { telegramUserId, fromDate, toDate }
  Output: { summary: string, advice: string[] }
```

**Переменная окружения:** `OPENROUTER_API_KEY` — добавить в `.env` и `.env.example`.

### 5. `summaryForTelegramUser` — сводка для бота

Аналог `healthLog.summary` (веб), но для бота. Нужен чтобы OpenClaw мог запросить агрегат без LLM-отчёта.

Добавить в `src/features/health-log/api/router.ts`:
```
healthLog.summaryForTelegramUser
  Input: { telegramUserId, fromDate, toDate }
  Output: { totalCalories, completedDaysCount, daysWithLogsCount }
```

### 6. Сохранение `DailySummary` в БД

Сейчас `DailySummary` — модель без данных. Записывать агрегат после каждого `upsertDailyLog`, чтобы отчёты строились быстрее без пересчёта.

Изменить `src/features/health-log/services/dailyLogService.ts`: в конце upsert-транзакции вызывать `upsertDailySummary(dailyLogId)`.

### 7. Health-check endpoint

Добавить `src/app/api/health/route.ts`:
```
GET /api/health → { ok: true }
```
Нужен для проверки доступности сервера из OpenClaw.

### 8. Деплой

- **Платформа**: Vercel (Next.js) + Neon или Railway (PostgreSQL managed)
- **Env vars в Vercel**: `DATABASE_URL`, `SERVICE_API_TOKEN`, `DEFAULT_TELEGRAM_USER_ID`, `OPENROUTER_API_KEY`
- Запустить `npx prisma migrate deploy` на prod-БД
- Настроить webhook OpenClaw на prod-URL

### 9. Настройка OpenClaw (конфигурация на сервере)

Описать `tools` для function calling:
- `upsertDailyLog` — запись дня (еда, вода, сон, активность, добавки)
- `getReport` — отчёт за период с советами
- `upsertProfile` — обновление анкеты пользователя
- `addLabResult` — добавление результата анализа
- `getProfile` — получить профиль и текущие показатели

В каждый вызов передавать:
- Заголовок `X-Service-Token`
- Поле `telegramUserId` = `message.from.id` из Telegram update

Системный промпт: ИИ-помощник по здоровью, дружелюбный, с заботой, знает цели пользователя. Никаких кнопок, только текстовый диалог.

---

## Следующий шаг (после MVP)

### Веб-дашборд / Telegram Mini App

После запуска бота и деплоя — сделать визуальный дашборд:
- Вариант A: улучшить текущий `/dashboard` в Next.js (графики динамики веса, КБЖУ, сна)
- Вариант B: Telegram Mini App (открывается прямо из бота, авторизация по `initData` от Telegram)

Выбор варианта — отдельное обсуждение.

---

## Порядок реализации

| # | Задача | Статус |
|---|--------|--------|
| 1 | Добавить `waterMl` в `DailyLog` + миграция | Не начато |
| 2 | API `UserProfile` (getProfile / upsertProfile) | Не начато |
| 3 | API `LabResult` (upsert / list) | Не начато |
| 4 | `reportService.ts` + `reportForTelegramUser` | Не начато |
| 5 | `summaryForTelegramUser` процедура | Не начато |
| 6 | Сохранение `DailySummary` в БД | Не начато |
| 7 | Health-check endpoint `/api/health` | Не начато |
| 8 | Деплой (Vercel + Neon) | Не начато |
| 9 | Настройка OpenClaw (конфигурация на сервере) | Не начато |

---

## Что НЕ делаем сейчас

- Кнопки в Telegram-боте — бот работает только через текстовый диалог (OpenClaw + LLM)
- Telegram Mini App / улучшение веб-дашборда — следующий шаг после MVP
- Текущий веб-интерфейс (`/logs`, `/dashboard`) — оставляем как есть, не удаляем, не развиваем
