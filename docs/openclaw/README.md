# Агент Надин для OpenClaw

Настройка AI-ассистента по здоровью в OpenClaw с подключением к nadin-health API.

---

## Как работает OpenClaw (важно понять сразу)

OpenClaw — **не фреймворк для написания кода**. Это готовый AI-агент рантайм.
Ты не пишешь pipeline, не реализуешь intent detection, не вызываешь LLM вручную.

**OpenClaw делает всё это сам:**
- Получает сообщение из Telegram
- Передаёт в LLM (через OpenRouter): системный промпт + история + сообщение + доступные скиллы
- LLM сам решает что ответить и какие инструменты вызвать
- OpenClaw выполняет инструменты (Shell-скрипты, curl и т.д.), возвращает результат в LLM
- LLM формирует финальный ответ → Telegram

**Твоя задача**: написать markdown-файлы, которые объясняют агенту КТО он и ЧТО умеет делать.

---

## Итоговая структура файлов на сервере

```
~/.openclaw/
├── openclaw.json          ← главный конфиг (токен, whitelist, модель, env vars)
├── .env                   ← секреты (API ключи, токены)
└── workspace/             ← рабочее пространство агента
    ├── AGENTS.md          ← инструкции поведения (что делать при запуске)
    ├── SOUL.md            ← кто агент, личность, системный промпт
    ├── MEMORY.md          ← долгосрочная память (создаётся агентом)
    ├── memory/            ← ежедневные записи (создаётся агентом)
    └── skills/
        └── nadin-health/
            ├── SKILL.md   ← описание API (агент читает и знает как вызывать)
            └── nadin.sh   ← bash-скрипт для curl-запросов к API
```

Все файлы из папки `workspace/` этого репозитория нужно скопировать в `~/.openclaw/workspace/` на сервере.

---

## Пошаговая настройка

### Шаг 1. Конфиг gateway

Скопируй `openclaw.example.json` (или `openclaw.example.json5`) → `~/.openclaw/openclaw.json` и отредактируй.

**Переменные окружения:** скопируй `docs/openclaw/.env.example` → `~/.openclaw/.env` и подставь реальные значения (OpenRouter API key, URL и токен nadin-health, токен Telegram-бота). Без этого плейсхолдеры `${VAR}` в конфиге не заработают.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    NADIN_HEALTH_API_URL: "https://твой-домен.ru",
    NADIN_HEALTH_SERVICE_TOKEN: "токен из nadin-health .env (SERVICE_API_TOKEN)",
    TELEGRAM_BOT_TOKEN: "токен из @BotFather",
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-opus-4-5" },
    },
  },
  channels: {
    telegram: {
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "allowlist",
      allowFrom: ["tg:ТВОЙ_TELEGRAM_ID", "tg:ВТОРОЙ_TELEGRAM_ID"],
    },
  },
}
```

`allowFrom` — это первая линия защиты. Только эти два пользователя могут писать боту.
Вторая линия — `ALLOWED_TELEGRAM_USER_IDS` в nadin-health .env (блокирует на уровне API).

Узнать свой Telegram ID: напиши боту, запусти `openclaw logs --follow`, найди `from.id`.

### Шаг 2. Скопировать workspace

```bash
# Создать директорию если нет
mkdir -p ~/.openclaw/workspace/skills/nadin-health

# Скопировать файлы (из корня этого репозитория)
cp docs/openclaw/workspace/SOUL.md ~/.openclaw/workspace/
cp docs/openclaw/workspace/AGENTS.md ~/.openclaw/workspace/
cp docs/openclaw/workspace/skills/nadin-health/SKILL.md ~/.openclaw/workspace/skills/nadin-health/
cp docs/openclaw/workspace/skills/nadin-health/SKILL-REFERENCE.md ~/.openclaw/workspace/skills/nadin-health/
cp docs/openclaw/workspace/skills/nadin-health/nadin.sh ~/.openclaw/workspace/skills/nadin-health/
cp docs/openclaw/workspace/HEARTBEAT.md ~/.openclaw/workspace/

# Сделать скрипт исполняемым
chmod +x ~/.openclaw/workspace/skills/nadin-health/nadin.sh
```

### Шаг 3. Запуск и одобрение пользователей

```bash
# Запустить gateway
openclaw gateway

# Проверить статус
openclaw health

# Если dmPolicy: "pairing" — одобрить пользователей вручную:
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>

# Если dmPolicy: "allowlist" — пользователи из allowFrom принимаются автоматически.
```

### Шаг 4. Проверка API

```bash
# Проверить доступность nadin-health
curl -s https://твой-домен.ru/api/health
# ожидается: {"ok":true}

# Тестовый вызов API
curl -s -X POST "https://твой-домен.ru/api/trpc/user.isProfileComplete" \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: ТОЙ_ТОКЕН" \
  -d '{"json":{"telegramUserId":"123456789"}}'
```

---

## Как работает вызов API из агента

LLM видит SKILL.md и знает, что для работы с данными здоровья нужно запустить:
```bash
bash {baseDir}/nadin.sh <procedure> '<json>'
```

Например, чтобы сохранить воду за день, агент выполнит:
```bash
bash ~/.openclaw/workspace/skills/nadin-health/nadin.sh \
  healthLog.upsertDailyLogForTelegramUser \
  '{"telegramUserId":"123456789","date":"2026-03-06","payload":{"waterMl":2000}}'
```

Скрипт `nadin.sh` оборачивает это в правильный curl-запрос к tRPC API.

---

## Алгоритм (что происходит при каждом сообщении)

```
Пользователь пишет в Telegram
    ↓
OpenClaw принимает сообщение
    ↓
Отправляет в LLM:
  • SOUL.md (системный промпт — личность, правила)
  • AGENTS.md (инструкции)
  • Список доступных скиллов (SKILL.md)
  • История разговора (автоматически)
  • Новое сообщение
    ↓
LLM принимает решение:
  • Если нужно сохранить или получить данные → вызывает nadin-health skill
  • Если общий вопрос → отвечает напрямую
    ↓
Если вызван skill → OpenClaw выполняет nadin.sh
    ↓
Результат → LLM формирует ответ
    ↓
OpenClaw отправляет ответ в Telegram
```

---

## Хранение данных

| Тип данных | Где хранится |
|---|---|
| Питание, сон, активность, замеры, анализы | nadin-health API (PostgreSQL) |
| История диалога (краткосрочная) | OpenClaw автоматически (в памяти сессии) |
| Имя, цели, предпочтения (долгосрочная) | `~/.openclaw/workspace/MEMORY.md` |
| Ежедневные заметки | `~/.openclaw/workspace/memory/YYYY-MM-DD.md` |

Агент сам пишет и читает MEMORY.md и memory/. Не нужна отдельная БД для агента.

---

## Файлы в этом репозитории

| Файл | Назначение | Куда копировать |
|---|---|---|
| `openclaw.example.json` | Пример конфига gateway (валидный JSON) | `~/.openclaw/openclaw.json` |
| `openclaw.example.json5` | То же с комментариями (JSON5) | опционально |
| `.env.example` | Шаблон переменных окружения | скопировать в `~/.openclaw/.env` и заполнить |
| `workspace/SOUL.md` | Личность агента (системный промпт) | `~/.openclaw/workspace/SOUL.md` |
| `workspace/AGENTS.md` | Инструкции поведения | `~/.openclaw/workspace/AGENTS.md` |
| `workspace/skills/nadin-health/SKILL.md` | Таблица процедур (без тяжёлых примеров) | `~/.openclaw/workspace/skills/nadin-health/SKILL.md` |
| `workspace/skills/nadin-health/SKILL-REFERENCE.md` | Полные payload-примеры (читается on-demand) | `~/.openclaw/workspace/skills/nadin-health/SKILL-REFERENCE.md` |
| `workspace/skills/nadin-health/nadin.sh` | Curl-обёртка для API | `~/.openclaw/workspace/skills/nadin-health/nadin.sh` |
| `workspace/HEARTBEAT.md` | Пустой файл — отключает лишние heartbeat-обороты | `~/.openclaw/workspace/HEARTBEAT.md` |
| `workspace-nadin-food-vision/SOUL.md` | Промпт агента по фото (вариант с отдельным агентом) | `~/.openclaw/workspace-nadin-food-vision/SOUL.md` |
| `workspace-nadin-food-vision/AGENTS.md` | Инструкции для агента по фото | `~/.openclaw/workspace-nadin-food-vision/AGENTS.md` |
| `OPENCLAW-SETUP.md` | Полная документация API (все процедуры) | Справочник, не копировать |
| `*.ts` в корне | Референсный код для **кастомной** реализации | Не для OpenClaw |

---

## Модель LLM для второго агента (openclaw.json)

Когда у тебя **два агента** (например main + nadin-food-vision), модель задаётся **для каждого агента отдельно** в `agents.list`. Каждый элемент списка может содержать поле `model` — оно переопределяет `agents.defaults.model` только для этого агента.

**Структура:** в конфиге должен быть массив `agents.list` с объектами агентов. У каждого объекта указываются `id`, `workspace` и при необходимости `model`.

**Формат `model`:**
- **Строка** — одна модель: `"provider/model"` (например `"openrouter/anthropic/claude-sonnet-4-5"`).
- **Объект** — основная модель и запасные: `{ "primary": "provider/model", "fallbacks": ["provider/model2"] }`.

Пример для main (текст) и nadin-food-vision (фото) с OpenRouter:

```json
"agents": {
  "list": [
    {
      "id": "main",
      "default": true,
      "workspace": "~/.openclaw/workspace",
      "model": {
        "primary": "openrouter/deepseek/deepseek-v3.2",
        "fallbacks": ["openrouter/openai/gpt-4o-2024-11-20"]
      }
    },
    {
      "id": "nadin-food-vision",
      "workspace": "~/.openclaw/workspace-nadin-food-vision",
      "model": {
        "primary": "openrouter/openai/gpt-4o-2024-11-20"
      }
    }
  ],
  "defaults": {
    "compaction": { "mode": "safeguard" },
    "maxConcurrent": 4
  }
}
```

- **main** использует `openrouter/deepseek/deepseek-v3.2` (и fallback при ошибке).
- **nadin-food-vision** использует `openrouter/openai/gpt-4o-2024-11-20` (хорошая поддержка изображений).

Если `agents.list` задан, то для агентов, у которых в объекте **нет** поля `model`, берётся `agents.defaults.model`. Имена моделей — как в каталоге OpenRouter (или другого провайдера); ключ API задаётся в `env` (например `OPENROUTER_API_KEY`).

---

## Агент по фото (еда, анализы, приложения)

Два варианта: один агент обрабатывает всё или отдельный агент **nadin-food-vision** только для фото (сложная модель для изображений, простая для текста). Пошаговая настройка, перенаправление из основного SOUL в nadin-food-vision и описание файлов — см. [AGENT-FOOD-PHOTO.md](AGENT-FOOD-PHOTO.md).

---

## Полезные команды OpenClaw

```bash
openclaw gateway          # запустить gateway
openclaw health           # проверить статус
openclaw logs --follow    # живые логи (смотреть from.id в Telegram updates)
openclaw context list     # посмотреть, какие файлы и история сейчас в контексте
openclaw context detail   # подробный разбор контекста по файлам и tool-результатам
openclaw config get       # показать текущий конфиг
openclaw doctor           # диагностика проблем
openclaw doctor --fix     # автоматически исправить проблемы конфига
```
