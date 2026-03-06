# Агент nadin для OpenClaw

Документация и референсный код для настройки агента **nadin** в OpenClaw, работающего с API nadin-health.

## Архитектура

```
Telegram → Agent (OpenClaw) → Intent detection → Parser → Memory → Tool router → nadin-health API → Context builder → LLM → Response validator → Telegram
```

## Создание агента в OpenClaw

1. Создай нового агента с именем **nadin** (в интерфейсе или конфиге OpenClaw).
2. Задай переменные окружения:
   - `NADIN_HEALTH_API_URL` — базовый URL API (например `https://itresolver.ru`, без завершающего слеша).
   - `NADIN_HEALTH_SERVICE_TOKEN` — значение `SERVICE_API_TOKEN` из nadin-health.
3. Скопируй код из папки `docs/openclaw/` в проект OpenClaw (см. структуру ниже).
4. Подключи pipeline из `agent.ts` к обработчику входящих сообщений Telegram.

## Структура файлов (куда копировать в репозитории OpenClaw)

| Файл в docs/openclaw | Назначение |
|----------------------|------------|
| [toolRouter.ts](toolRouter.ts) | Карта действий → tRPC-процедуры, исполнитель запросов к API |
| [intentDetector.ts](intentDetector.ts) | Определение намерения пользователя перед вызовом API |
| [parser.ts](parser.ts) | Извлечение структурированных данных из свободного текста |
| [memory.ts](memory.ts) | Краткосрочная память чата (таблица chat_memory) |
| [userFacts.ts](userFacts.ts) | Долгосрочные факты о пользователе (таблица user_facts) |
| [contextBuilder.ts](contextBuilder.ts) | Преобразование ответов API в компактный текст для LLM |
| [responseValidator.ts](responseValidator.ts) | Проверка ответа на выдуманные факты перед отправкой |
| [agent.ts](agent.ts) | Полный pipeline: intent → parser → memory → tool → context → LLM → validator |
| [knowledge/healthGuidelines.ts](knowledge/healthGuidelines.ts) | Справочные рекомендации по здоровью |
| [prompts/](prompts/) | Системный, чат-, лог- и анализ-промпты |

## База данных (на стороне OpenClaw)

Нужны две таблицы:

- **chat_memory** — `telegram_user_id`, `role`, `content`, `created_at`.
- **user_facts** — `telegram_user_id`, `key`, `value`.

Готовый SQL: [schema.sql](schema.sql).

## Быстрая настройка через чат

Если OpenClaw поддерживает настройку через диалог, можно вставить в чат содержимое файла **[AGENT-SETUP-INSTRUCTIONS.md](AGENT-SETUP-INSTRUCTIONS.md)** — там одна общая инструкция для создания и настройки агента nadin.

## Связь с nadin-health

- Описание API, заголовков и всех tools: [../OPENCLAW-SETUP.md](../OPENCLAW-SETUP.md).
- Проверка API: `curl -s https://<домен>/api/health` → `{"ok":true}`.
