# Прогресс реализации nadin-health

Последнее обновление: актуальный срез на основе анализа кодовой базы.

---

## Сделано

### Инфраструктура
- [x] Next.js 16 (App Router), TypeScript
- [x] tRPC: сервер (`src/server/api/trpc.ts`, `src/server/api/root.ts`), HTTP-адаптер (`src/app/api/trpc/[trpc]/route.ts`)
- [x] Prisma 7 + адаптер `@prisma/adapter-pg` (pg-драйвер), клиент в `src/generated/prisma`
- [x] PostgreSQL локально: Docker Compose (`docker-compose.yml`), порт 5434
- [x] Первая миграция выполнена (`prisma/migrations/20260304194659_init_health_schema`)
- [x] Логгер (`src/shared/lib/logger.ts`)
- [x] Vitest (`vitest.config.ts`, `npm run test`)

### Схема БД (Prisma)
- [x] `User` (id, role, telegramUserId) — email/passwordHash удалены, миграция применена
- [x] `UserProfile` (антропометрия, цели, условия)
- [x] `DailyLog` (дата, настроение, комментарий, флаг завершения)
- [x] `Meal` (тип, калории, БЖУ, фото)
- [x] `IntakeItem` (витамины, лекарства)
- [x] `SleepLog` (старт, конец, качество)
- [x] `ActivityLog` (тип, длительность, интенсивность)
- [x] `LabResult` (анализы)
- [x] `FileAsset` (файлы/фото)
- [x] `DailySummary` (агрегированные данные дня)

### Авторизация и пользователи
- [x] Авторизация по `X-Service-Token` для бота (OpenClaw) в `createContext`
- [x] `ensureUserByTelegramId`: поиск или автосоздание пользователя по Telegram id
- [x] `DEFAULT_TELEGRAM_USER_ID` в env для веб-интерфейса (один пользователь)
- [x] Вход по логину/паролю полностью удалён (нет login/register страниц и роутеров)

### API для бота (X-Service-Token + telegramUserId)
- [x] `healthLog.getDailyLogForTelegramUser`
- [x] `healthLog.listDailyLogsForTelegramUser`
- [x] `healthLog.upsertDailyLogForTelegramUser`

### API для веба (DEFAULT_TELEGRAM_USER_ID)
- [x] `healthLog.getDailyLog`
- [x] `healthLog.listDailyLogs`
- [x] `healthLog.upsertDailyLog`
- [x] `healthLog.summary`

### Сервисный слой (бизнес-логика)
- [x] `upsertDailyLog` — транзакция: upsert DailyLog + перезапись Meal/IntakeItem/SleepLog/ActivityLog
- [x] `getDailyLogByDate` — загрузка лога со всеми вложенными данными
- [x] `listDailyLogs` — пагинация по курсору (newest first)
- [x] `getSimpleSummary` — агрегация калорий и счётчиков за период
- [x] `aggregateLogsToSummary` — чистая функция агрегации (для тестов, в `summaryUtils.ts`)
- [x] Zod-схемы: `dateStringSchema`, `dailyLogPayloadSchema` и вложенные схемы

### Веб-страницы
- [x] Главная (`/`) — навигация на Logs и Dashboard
- [x] Список логов (`/logs`) — `DailyLogList`, пагинация, ссылки на день
- [x] Страница дня (`/logs/[date]`) — `DailyLogEditor`: настроение, комментарий, «день завершён», секции Meals/Sleep/Activity/Intakes
- [x] Дашборд (`/dashboard`) — выбор периода, сводка: калории, дни с логами, завершённые дни

### Тесты
- [x] Тесты агрегации сводки `aggregateLogsToSummary` (`dailyLogService.test.ts`, 7 тестов)
- [x] Тесты `ensureUserByTelegramId` с моком Prisma (`ensureUserByTelegramId.test.ts`, 4 теста)

### Документация
- [x] `README.md` — стек, запуск, env, API
- [x] `docs/APP-PLAN.md` — общий план приложения
- [x] `docs/IMPLEMENTATION-STATUS.md` — статус реализации
- [x] `docs/MULTI-USER-BOT-PLAN.md` — мультипользовательский бот

---

## Не сделано / Осталось

### Интеграция бота (на стороне OpenClaw, вне репозитория)
- [ ] Настроить OpenClaw: при каждом вызове API передавать `telegramUserId` (из `message.from.id`) и заголовок `X-Service-Token`
- [ ] Проверить сквозной сценарий: сообщение в Telegram → OpenClaw → API → запись в БД

### Тесты
- [ ] Тесты для `upsertDailyLog`, `getDailyLogByDate`, `listDailyLogs` (с моком Prisma — сложнее из-за `$transaction`)

### Деплой
- [ ] Выбрать платформу для продакшена (Vercel + Neon/Railway/Supabase или VPS)
- [ ] Настроить production env: `DATABASE_URL`, `SERVICE_API_TOKEN`, `DEFAULT_TELEGRAM_USER_ID`
- [ ] Запустить `npx prisma migrate deploy` на продакшен-БД
- [ ] Проверить end-to-end в продакшене

### По желанию
- [ ] Процедура `user.getMe` для бота — возврат info о пользователе по `telegramUserId` (при X-Service-Token)
- [ ] Процедура `healthLog.summaryForTelegramUser` — сводка за период для бота
- [ ] Веб-логин через Telegram Login Widget — несколько пользователей в вебе со своими данными
- [ ] Профиль пользователя: заполнение `UserProfile` (рост, вес, цели) — через бота и/или в вебе
- [x] ~~Удаление `email`/`passwordHash` из схемы Prisma~~ — выполнено, миграция применена

---

## Сводка

| Область                        | Статус        |
|--------------------------------|---------------|
| Инфраструктура (Next, tRPC, Prisma, Docker) | Готово |
| Схема БД (все модели)          | Готово        |
| Авторизация (service token)    | Готово        |
| API для бота                   | Готово        |
| API для веба                   | Готово        |
| Веб-страницы (logs, dashboard) | Готово        |
| Форма: настроение/комментарий  | Готово        |
| Форма: еда, сон, активность    | Готово        |
| Тесты: агрегация               | Готово        |
| Тесты: ensureUserByTelegramId  | Готово        |
| Тесты: upsert/get транзакции   | Не сделано    |
| Интеграция OpenClaw/бот        | Не проверено  |
| Деплой на продакшен            | Не сделано    |
| Профиль пользователя (UserProfile) | Не сделано |
| getMe / summaryForTelegramUser | Опционально   |
| Веб-логин по Telegram          | Опционально   |
