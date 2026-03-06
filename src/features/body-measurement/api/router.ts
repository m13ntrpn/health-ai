import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc";
import { ensureUserByTelegramId } from "@/features/telegram-user/services/ensureUserByTelegramId";
import {
  addBodyMeasurement,
  listBodyMeasurements,
} from "@/features/body-measurement/services/bodyMeasurementService";
import { bodyMeasurementPayloadSchema } from "@/features/body-measurement/schemas/bodyMeasurement";

const telegramUserIdSchema = z.string().min(1, "telegramUserId is required");

function assertServiceAuth(ctx: { serviceAuth: boolean }): void {
  if (!ctx.serviceAuth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Service token required (X-Service-Token header)",
    });
  }
}

export const bodyMeasurementRouter = router({
  addForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        payload: bodyMeasurementPayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return addBodyMeasurement(user.id, input.payload);
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
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return listBodyMeasurements(user.id, input.limit, input.cursor);
    }),
});

