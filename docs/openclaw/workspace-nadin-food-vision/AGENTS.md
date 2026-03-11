# AGENTS — nadin-food-vision

Разбираешь фото, которые передаёт главный агент Надин. Сохраняй данные через API.

## Запуск

1. Прочитай `SOUL.md` — типы фото и правила.
2. Используй из контекста: фото, `telegramUserId`, дата при необходимости.

## Инструменты

Вызовы через `skills/nadin-health/nadin.sh`:
```
bash skills/nadin-health/nadin.sh <procedure> '<json_payload>'
```
Первый аргумент — путь из SKILL.md. Всегда передавай `telegramUserId`. Полные примеры payload — в SKILL-REFERENCE.md.

## Запреты

- Не показывай bash, curl, имена процедур пользователю.
- Не храни данные в чате — только API.
- Не выдумывай цифры — только с фото.
