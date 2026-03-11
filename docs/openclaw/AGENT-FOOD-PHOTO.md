# Агент по фото (еда, анализы, приложения) в OpenClaw

Два варианта настройки: один агент обрабатывает всё (текст + фото) или отдельный агент **nadin-food-vision** только для фото — с более сложной моделью для изображений и более простой для текста.

---

## Вариант A: Один агент

Вся логика в одном workspace: и текст, и фото обрабатывает один агент (одна модель).

- В `openclaw.json`: `tools.media.image.enabled: true`.
- В `workspace/SOUL.md` — блок «Фото от пользователя» с правилами по типам (еда, анализы, приложения). Если переключиться на вариант B, этот блок заменён на перенаправление в subagent (см. ниже).

---

## Вариант B: Два агента (main + nadin-food-vision)

**Идея:** главный агент (Надин) обрабатывает только текст и при получении фото вызывает subagent **nadin-food-vision**. У vision-агента своя модель (например, более сильная по vision) и свой workspace с узким промптом только для разбора фото. Так можно ставить «простую» модель для текста и «сложную» для фото.

### Роль агентов

| Агент | Обрабатывает | Модель (пример) |
|-------|----------------|------------------|
| main (Надин) | Текст: питание, сон, замеры, отчёты, первый контакт. При фото — вызов subagent и передача ответа пользователю. | Простая/быстрая |
| nadin-food-vision | Только фото: еда → КБЖУ, анализы/меддокументы → labPanel/labResult, скриншоты приложений → сон/шаги/вес. Сохраняет через nadin-health API. | Сложная/vision |

### Файлы в репозитории

- **Главный агент (текст):** `docs/openclaw/workspace/SOUL.md`, `docs/openclaw/workspace/AGENTS.md`. В SOUL блок «Фото от пользователя» — перенаправление в nadin-food-vision (вызов subagent, передать сообщение с фото и контекст, ответ subagent вернуть пользователю).
- **Vision-агент:** `docs/openclaw/workspace-nadin-food-vision/SOUL.md`, `docs/openclaw/workspace-nadin-food-vision/AGENTS.md`. Там полное описание: типы фото (еда, анализы, приложения), какие процедуры вызывать, тон, запреты.
- **Скилл nadin-health** нужен и главному агенту, и vision-агенту. На сервере либо копируй `workspace/skills/nadin-health` в `workspace-nadin-food-vision/skills/`, либо используй общий скилл из `~/.openclaw/skills/` (см. документацию OpenClaw про per-agent и shared skills).

### Пошаговая настройка на сервере

#### 1. Добавить агента nadin-food-vision (если ещё не добавлен)

```bash
openclaw agents add nadin-food-vision
```

Появится свой `agentDir` и по умолчанию workspace (например `~/.openclaw/workspace-nadin-food-vision`).

#### 2. Указать workspace и модель для каждого агента

В `openclaw.json` (или JSON5) нужны оба агента в `agents.list` и маршрутизация по умолчанию на main (bindings оставляешь как у тебя — по каналу/аккаунту). Пример:

```json
"agents": {
  "list": [
    {
      "id": "main",
      "default": true,
      "workspace": "~/.openclaw/workspace",
      "model": { "primary": "openrouter/.../быстрая-модель" }
    },
    {
      "id": "nadin-food-vision",
      "workspace": "~/.openclaw/workspace-nadin-food-vision",
      "model": { "primary": "openrouter/.../vision-модель" }
    }
  ],
  "defaults": { ... }
}
```

Главному агенту — твой текущий workspace (`~/.openclaw/workspace`), vision-агенту — `~/.openclaw/workspace-nadin-food-vision`. Модель для nadin-food-vision выбери с хорошей поддержкой изображений.

#### 3. Включить вызов subagent (agent-to-agent)

Чтобы main мог вызывать nadin-food-vision:

```json
"tools": {
  "agentToAgent": {
    "enabled": true,
    "allow": ["main", "nadin-food-vision"]
  }
}
```

#### 4. Скопировать файлы workspace на сервер

- В `~/.openclaw/workspace/` — актуальные `SOUL.md` и `AGENTS.md` из `docs/openclaw/workspace/` (с перенаправлением фото в nadin-food-vision).
- В `~/.openclaw/workspace-nadin-food-vision/` — `SOUL.md` и `AGENTS.md` из `docs/openclaw/workspace-nadin-food-vision/`.
- Скилл `nadin-health` (папка `skills/nadin-health` с `SKILL.md` и `nadin.sh`) — в оба workspace или в общий каталог скиллов, чтобы nadin-food-vision мог вызывать API.

#### 5. Включить медиа для главного агента

Чтобы главный агент «видел», что в сообщении есть фото, и мог передать его subagent:

```json
"tools": {
  "media": {
    "image": { "enabled": true }
  }
}
```

#### 6. Проверка

1. Запуск: `openclaw gateway`.
2. Текст (например «Съел овсянку») — обрабатывает main.
3. Фото еды/анализов/приложения — main вызывает nadin-food-vision, пользователь получает ответ от vision-агента (запись в дневник и т.д.).

### Перенаправление из основного SOUL

В `workspace/SOUL.md` блок **«Фото от пользователя»** сформулирован так:

- При получении фото не обрабатывать его самой.
- Вызвать subagent с `agentId: nadin-food-vision`, передать ему сообщение пользователя (с фото) и контекст (в т.ч. `telegramUserId`).
- Ответ nadin-food-vision вернуть пользователю как свой ответ без изменений.

В `workspace/AGENTS.md` указано: при наличии изображения в сообщении вызывать subagent nadin-food-vision и передать ему ответ пользователю; обработку типов фото выполняет агент nadin-food-vision (его логика в `workspace-nadin-food-vision/SOUL.md`).

---

## Итог

| Задача | Вариант A | Вариант B |
|--------|-----------|-----------|
| Обработка фото | Один агент, одна модель | Subagent nadin-food-vision, своя модель |
| Еда → КБЖУ | В основном SOUL | В SOUL nadin-food-vision |
| Анализы / приложения по фото | В основном SOUL | В SOUL nadin-food-vision |
| Текст (питание, сон, отчёты) | Основной агент | Основной агент (main) |
| Конфиг | Один workspace | Два агента в `agents.list`, `agentToAgent.allow` с nadin-food-vision |

Если используешь вариант B, в репозитории уже есть готовые `workspace/SOUL.md`, `workspace/AGENTS.md` и `workspace-nadin-food-vision/SOUL.md`, `workspace-nadin-food-vision/AGENTS.md` под перенаправление фото в агента **nadin-food-vision**.
