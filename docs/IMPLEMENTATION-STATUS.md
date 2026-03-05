# Статус реализации

План реализации: что сделано и что нужно сделать. Обновляйте по мере развития проекта.

---

## Сделано

### Инфраструктура

- Next.js 16 (App Router), TypeScript, tRPC, Prisma.
- PostgreSQL: Docker Compose (порт 5434), миграции Prisma, генерация клиента в `src/generated/prisma`, адаптер `@prisma/adapter-pg`.
- Контекст tRPC: проверка `X-Service-Token` (service auth), без JWT.
- tRPC-клиент для браузера без заголовков авторизации (веб — один пользователь из env).

### Пользователи

- Модель User с полем `telegramUserId` (unique).
- `ensureUserByTelegramId(telegramUserId)`: поиск или создание пользователя по Telegram id (placeholder email/password для Telegram-only).
- Вход по логину/паролю удалён; веб использует `DEFAULT_TELEGRAM_USER_ID` из env.

### API для бота

- `healthLog.getDailyLogForTelegramUser` — лог за день по `telegramUserId`.
- `healthLog.listDailyLogsForTelegramUser` — список логов с пагинацией.
- `healthLog.upsertDailyLogForTelegramUser` — создание/обновление лога за день.
- Все процедуры требуют заголовок `X-Service-Token` и передачу `telegramUserId` в теле запроса.

### API для веба

- `healthLog.getDailyLog`, `healthLog.listDailyLogs`, `healthLog.upsertDailyLog`, `healthLog.summary`.
- Пользователь определяется через `DEFAULT_TELEGRAM_USER_ID` (resolveWebUserId).

### Веб-страницы

- Главная (`/`) — ссылки на Logs и Dashboard.
- Список логов (`/logs`) — пагинация, ссылки на страницу дня.
- Страница дня (`/logs/[date]`) — форма: настроение, комментарий, «день завершён», сохранение.
- Дашборд (`/dashboard`) — выбор периода (from/to), сводка: калории, дни с логами, завершённые дни.

### Тесты

- Vitest, конфиг с алиасом `@/`.
- Тесты агрегации сводки (`summaryUtils`, `aggregateLogsToSummary`).
- Тесты auth (password) удалены вместе с логином/паролем.

### Документация

- README: стек, запуск, env, API, мультипользовательский бот.
- [docs/MULTI-USER-BOT-PLAN.md](MULTI-USER-BOT-PLAN.md) — план по мультипользовательскому боту.
- [docs/APP-PLAN.md](APP-PLAN.md) — общий план приложения.

---

## Нужно сделать / опционально

### Интеграция OpenClaw / Fatherbot (вне репозитория)

- Убедиться, что при каждом вызове API nadin-health передаётся **telegramUserId** того, кто написал в Telegram (например, `message.from.id` из update).
- Контракт и примеры — в [docs/MULTI-USER-BOT-PLAN.md](MULTI-USER-BOT-PLAN.md).

### По желанию

- Процедура «текущий пользователь» для бота: `getMe` / `getByTelegramId` (при X-Service-Token) — возврат минимальной информации о пользователе (id, позже — имя из профиля), чтобы бот мог показывать «вы залогинены как …».

### Позже

- Веб-логин по Telegram (например, [Telegram Login Widget](https://core.telegram.org/widgets/login)), чтобы несколько людей могли заходить на сайт и видеть каждый свои данные вместо одного `DEFAULT_TELEGRAM_USER_ID`.

---

## Сводка статусов

| Область           | Статус   | Примечание                          |
|-------------------|----------|-------------------------------------|
| Инфраструктура    | Готово   | Docker, Prisma, tRPC                |
| Пользователи      | Готово   | По telegramUserId, без пароля      |
| API бота          | Готово   | Мультипользовательский              |
| API веба          | Готово   | Один пользователь из env            |
| Веб-страницы      | Готово   | Logs, Dashboard                     |
| Тесты             | Частично | Агрегация сводки                    |
| Интеграция бота   | Проверить| Передача telegramUserId в OpenClaw  |
| getMe для бота    | Опционально | По желанию                       |
| Веб-логин Telegram| Не начато| Отдельная задача                    |
