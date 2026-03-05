# План приложения nadin-health

## Цель продукта

- **Дневник здоровья:** ежедневные записи (логи), приёмы пищи, добавки/лекарства, сон, активность.
- **Основной сценарий:** пользователи общаются с приложением через **Telegram-бота** (Fatherbot + OpenClaw + OpenRouter). Бот поддерживает **несколько пользователей** — каждый идентифицируется по Telegram user id.
- **Веб (опционально):** просмотр и редактирование логов и сводки в браузере. Сейчас веб показывает данные **одного** пользователя, заданного в `DEFAULT_TELEGRAM_USER_ID` (без входа в аккаунт).
- **Без логина/пароля:** авторизация бота — заголовок `X-Service-Token` + параметр `telegramUserId` в каждом запросе; веб — один фиксированный пользователь из env.

## Стек

- **Frontend:** Next.js 16 (App Router), TypeScript.
- **Backend:** tRPC, Prisma ORM.
- **БД:** PostgreSQL (локально — Docker, порт 5434; продакшен — Neon/Railway/Supabase).
- **Авторизация:** один общий `SERVICE_API_TOKEN` для бота; пользователь определяется по `telegramUserId`. Веб использует `DEFAULT_TELEGRAM_USER_ID` из env.

## Архитектура

- **Feature-based структура:** код по фичам (`features/health-log`, `features/telegram-user`), внутри — api, services, components, schemas.
- **API-first:** вся работа с данными через tRPC-процедуры; фронт не обращается к БД напрямую.
- **Общее:** `src/shared` — prisma-клиент, логгер, tRPC-клиент для браузера; `src/server/api` — корневой роутер и контекст tRPC.

## Основные фичи (текущие)

- **Модели данных (Prisma):** User (с `telegramUserId`), UserProfile, DailyLog, Meal, IntakeItem, SleepLog, ActivityLog, FileAsset, DailySummary.
- **Пользователи:** создание/поиск по Telegram id (`ensureUserByTelegramId`), без email/пароля для бота.
- **Дневник:** создание/обновление лога за день (настроение, комментарий, флаг «день завершён»), вложенные сущности (приёмы пищи, добавки, сон, активность).
- **Сводка за период:** сумма калорий, количество дней с логами и завершённых дней.
- **Веб:** главная, список логов (`/logs`), страница дня (`/logs/[date]`) с формой, дашборд (`/dashboard`) с выбором периода и сводкой.
- **Бот:** процедуры `*ForTelegramUser` — передача `telegramUserId` в каждом вызове; мультипользовательский режим «из коробки».

## Связанные документы

- [README.md](../README.md) — запуск, переменные окружения, скрипты, кратко API.
- [docs/MULTI-USER-BOT-PLAN.md](MULTI-USER-BOT-PLAN.md) — мультипользовательский бот: контракт API, интеграция OpenClaw.
- [docs/IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md) — что сделано и что нужно сделать.
