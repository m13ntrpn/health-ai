/**
 * Whitelist of Telegram user IDs allowed to use the bot (service procedures).
 * If ALLOWED_TELEGRAM_USER_IDS is not set or empty, all IDs are allowed.
 * Format: comma-separated, e.g. "123456789,987654321"
 */

import { TRPCError } from "@trpc/server";

const ENV_KEY = "ALLOWED_TELEGRAM_USER_IDS";

function parseAllowedIds(): Set<string> | null {
  const raw = process.env[ENV_KEY]?.trim();
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(ids);
}

let cached: Set<string> | null | undefined = undefined;

/** Returns allowed Telegram user IDs, or null if whitelist is disabled (allow all). */
export function getAllowedTelegramUserIds(): Set<string> | null {
  if (cached === undefined) {
    cached = parseAllowedIds();
  }
  return cached;
}

/** Throws if whitelist is enabled and telegramUserId is not in the list. */
export function assertAllowedTelegramUser(telegramUserId: string): void {
  const allowed = getAllowedTelegramUserIds();
  if (allowed === null) return;
  if (allowed.has(telegramUserId)) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "This Telegram user is not allowed to use the bot.",
  });
}
