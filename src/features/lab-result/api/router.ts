import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc";
import { labResultPayloadSchema } from "@/features/lab-result/schemas/labResult";
import { addLabResult, listLabResults } from "@/features/lab-result/services/labResultService";
import { ensureUserByTelegramId } from "@/features/telegram-user/services/ensureUserByTelegramId";
import { assertAllowedTelegramUser } from "@/shared/lib/allowedTelegramUsers";

const telegramUserIdSchema = z.string().min(1, "telegramUserId is required");

function assertServiceAuth(ctx: { serviceAuth: boolean }): void {
  if (!ctx.serviceAuth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Service token required (X-Service-Token header)",
    });
  }
}

export const labResultRouter = router({
  addForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        payload: labResultPayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      assertAllowedTelegramUser(input.telegramUserId);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return addLabResult(user.id, input.payload);
    }),

  listForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      assertAllowedTelegramUser(input.telegramUserId);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return listLabResults(user.id, input.limit, input.cursor);
    }),
});
