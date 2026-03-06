import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc";
import { ensureUserByTelegramId } from "@/features/telegram-user/services/ensureUserByTelegramId";
import {
  addLabPanel,
  listLabPanels,
} from "@/features/lab-panel/services/labPanelService";
import { labPanelPayloadSchema } from "@/features/lab-panel/schemas/labPanel";

const telegramUserIdSchema = z.string().min(1, "telegramUserId is required");

function assertServiceAuth(ctx: { serviceAuth: boolean }): void {
  if (!ctx.serviceAuth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Service token required (X-Service-Token header)",
    });
  }
}

export const labPanelRouter = router({
  addForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        payload: labPanelPayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return addLabPanel(user.id, input.payload);
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
      return listLabPanels(user.id, input.limit, input.cursor);
    }),
});

