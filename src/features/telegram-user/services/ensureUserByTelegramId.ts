import { prisma } from "@/shared/lib/prisma";
import type { User } from "@/generated/prisma/client";

/**
 * Finds a user by telegramUserId or creates one.
 * Handles concurrent creation via P2002 retry.
 */
export async function ensureUserByTelegramId(
  telegramUserId: string,
): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { telegramUserId },
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.user.create({
      data: { telegramUserId },
    });
  } catch (e) {
    const prismaError = e as { code?: string };
    // Concurrent insert: another request created the user first
    if (prismaError.code === "P2002") {
      const created = await prisma.user.findUnique({
        where: { telegramUserId },
      });
      if (created) return created;
    }
    throw e;
  }
}
