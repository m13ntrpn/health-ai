# Деплой на VPS (Ubuntu 24.04)

## Архитектура

```
Интернет → Nginx (443/HTTPS) → Next.js app (3000) → PostgreSQL (внутри Docker)
```

---

## Шаг 1. Подготовка сервера

Подключись к VPS по SSH:

```bash
ssh root@YOUR_SERVER_IP
```

Установи Docker и Docker Compose:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Проверь:

```bash
docker --version
docker compose version
```

Установи Nginx и Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

---

## Шаг 2. Загрузка кода на сервер

**Вариант A: через Git (рекомендуется)**

```bash
# На сервере
git clone https://github.com/YOUR_USERNAME/nadin-health.git /opt/nadin-health
cd /opt/nadin-health
```

**Вариант B: через rsync с локальной машины**

```bash
# На твоём Mac
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  /Users/mikhailvalov/Documents/Projects/nadin-health/ \
  root@YOUR_SERVER_IP:/opt/nadin-health/
```

---

## Шаг 3. Создать .env на сервере

```bash
cd /opt/nadin-health
cp .env.example .env.prod
nano .env.prod
```

Заполни файл:

```env
# PostgreSQL
POSTGRES_USER=nadin
POSTGRES_PASSWORD=СГЕНЕРИРУЙ_СЛОЖНЫЙ_ПАРОЛЬ
POSTGRES_DB=nadin_db

# Эта строка должна совпадать с POSTGRES_* выше
DATABASE_URL="postgresql://nadin:СГЕНЕРИРУЙ_СЛОЖНЫЙ_ПАРОЛЬ@postgres:5432/nadin_db?schema=public"

# Токен для OpenClaw — придумай любую длинную строку
SERVICE_API_TOKEN="СГЕНЕРИРУЙ_ДЛИННЫЙ_ТОКЕН"

# Твой Telegram ID для веб-интерфейса (узнать: написать @userinfobot в Telegram)
DEFAULT_TELEGRAM_USER_ID=""

# OpenRouter API ключ (https://openrouter.ai/keys)
OPENROUTER_API_KEY=""
```

> Сгенерировать пароль/токен: `openssl rand -hex 32`

---

## Шаг 4. Сборка Docker-образа

```bash
cd /opt/nadin-health

# Собрать образ
docker build -t nadin-health:latest .
```

Это займёт 2-5 минут при первом запуске.

---

## Шаг 5. Запуск контейнеров

```bash
# Запустить postgres и приложение
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Проверить статус
docker compose -f docker-compose.prod.yml ps

# Посмотреть логи
docker compose -f docker-compose.prod.yml logs -f app
```

Контейнер `migrate` запустится, выполнит `prisma migrate deploy` и остановится — это нормально.

Проверь, что приложение отвечает:

```bash
curl http://localhost:3000/api/health
# Ожидаемый ответ: {"ok":true}
```

---

## Шаг 6. Настройка Nginx

```bash
nano /etc/nginx/sites-available/nadin-health
```

Вставь (замени `YOUR_DOMAIN.COM` на свой домен):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.COM;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируй конфиг:

```bash
ln -s /etc/nginx/sites-available/nadin-health /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Шаг 7. SSL-сертификат (HTTPS)

Убедись, что домен указывает на IP сервера (A-запись в DNS).

```bash
certbot --nginx -d YOUR_DOMAIN.COM
```

Certbot сам обновит конфиг Nginx и добавит редирект с HTTP на HTTPS.

Проверь автообновление сертификата:

```bash
certbot renew --dry-run
```

---

## Шаг 8. Проверка

```bash
# Health check через HTTPS
curl https://YOUR_DOMAIN.COM/api/health

# Логи приложения
docker compose -f docker-compose.prod.yml logs -f app
```

Открой в браузере: `https://YOUR_DOMAIN.COM`

---

## Обновление приложения (после изменений в коде)

```bash
cd /opt/nadin-health

# Получить новый код
git pull

# Пересобрать образ
docker build -t nadin-health:latest .

# Перезапустить (migrate запустится автоматически)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Проверить
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

---

## Полезные команды

```bash
# Остановить всё
docker compose -f docker-compose.prod.yml down

# Посмотреть логи postgres
docker compose -f docker-compose.prod.yml logs postgres

# Зайти в контейнер приложения
docker compose -f docker-compose.prod.yml exec app sh

# Зайти в psql
docker compose -f docker-compose.prod.yml exec postgres psql -U nadin -d nadin_db

# Бэкап БД
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U nadin nadin_db > backup_$(date +%Y%m%d).sql
```

---

## Настройка OpenClaw после деплоя

После успешного деплоя обнови в OpenClaw URL API:

```
https://YOUR_DOMAIN.COM/api/trpc
```

И установи заголовок:

```
X-Service-Token: <значение SERVICE_API_TOKEN из .env.prod>
```

Подробнее — в [docs/OPENCLAW-SETUP.md](OPENCLAW-SETUP.md).
