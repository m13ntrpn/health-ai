# nadin-health

Health diary: daily logs, meals, sleep, activity. **Bot supports multiple users** (each identified by Telegram user id). Optional web UI shows one user (`DEFAULT_TELEGRAM_USER_ID`). No login/password — bot uses `X-Service-Token` + `telegramUserId`; web uses env default.

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Backend:** tRPC, Prisma ORM
- **Database:** PostgreSQL (Docker locally; Neon/Railway/Supabase in production)
- **Auth:** `X-Service-Token` for bot; `DEFAULT_TELEGRAM_USER_ID` in env for web UI (single user). Bot: one token, many users — each request sends `telegramUserId` (e.g. from `message.from.id`).

## Getting started (local)

1. **Copy env and set variables**

   ```bash
   cp .env.example .env
   # Set DEFAULT_TELEGRAM_USER_ID (Telegram user id for web Logs/Dashboard).
   # Set SERVICE_API_TOKEN for OpenClaw. Adjust DATABASE_URL if needed.
   ```

2. **Start Postgres (Docker)**

   ```bash
   docker compose up -d
   ```

   Default: `postgres` / `postgres` @ `127.0.0.1:5434`, database `nadin_db`.

3. **Generate Prisma client and run migrations**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Logs and Dashboard use the user identified by `DEFAULT_TELEGRAM_USER_ID`. Bot calls use `X-Service-Token` + `telegramUserId` in procedure input.

## Environment variables

| Variable                   | Required   | Description |
|----------------------------|------------|-------------|
| `DATABASE_URL`             | Yes        | PostgreSQL connection string. |
| `DEFAULT_TELEGRAM_USER_ID` | For web UI | Telegram user id for the single user; used by Logs and Dashboard. |
| `SERVICE_API_TOKEN`        | For bot    | Secret sent in `X-Service-Token` by OpenClaw; required for `*ForTelegramUser` procedures. |

See `.env.example` for a template.

## Deploy (MVP)

- **App:** Deploy to [Vercel](https://vercel.com) or any Node host. Build: `npm run build`; start: `npm run start`.
- **Database:** Create Postgres (Neon, Railway, Supabase), set `DATABASE_URL`.
- **Env:** Set `DATABASE_URL`, `DEFAULT_TELEGRAM_USER_ID` (for web), `SERVICE_API_TOKEN` (for bot). Do not commit secrets.
- **Migrations:** Run `npx prisma migrate deploy` after DB is created.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run test` — Run Vitest tests
- `npm run test:watch` — Vitest watch mode

## API (tRPC)

- **Web (no auth; server uses DEFAULT_TELEGRAM_USER_ID):** `healthLog.getDailyLog`, `healthLog.listDailyLogs`, `healthLog.upsertDailyLog`, `healthLog.summary`.
- **Bot (X-Service-Token + telegramUserId in input):** `healthLog.getDailyLogForTelegramUser`, `healthLog.listDailyLogsForTelegramUser`, `healthLog.upsertDailyLogForTelegramUser`.  
  **Multiple users:** send the Telegram user id of the person who sent the message (e.g. `message.from.id` from the Telegram update). Each user gets their own data. See [docs/MULTI-USER-BOT-PLAN.md](docs/MULTI-USER-BOT-PLAN.md) for details.

Endpoint: `POST /api/trpc` (batch). Service calls send `X-Service-Token` header.
