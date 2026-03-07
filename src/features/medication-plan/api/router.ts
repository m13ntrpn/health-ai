import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc";
import { ensureUserByTelegramId } from "@/features/telegram-user/services/ensureUserByTelegramId";
import {
  addMedicationPlan,
  listMedicationPlans,
} from "@/features/medication-plan/services/medicationPlanService";
import { medicationPlanPayloadSchema } from "@/features/medication-plan/schemas/medicationPlan";
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

export const medicationPlanRouter = router({
  addForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        payload: medicationPlanPayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      assertAllowedTelegramUser(input.telegramUserId);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return addMedicationPlan(user.id, input.payload);
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
      return listMedicationPlans(user.id, input.limit, input.cursor);
    }),
});

