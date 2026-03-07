import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc";
import { ensureUserByTelegramId } from "@/features/telegram-user/services/ensureUserByTelegramId";
import { getUserProfile, upsertUserProfile, getProfileCompleteness } from "@/features/telegram-user/services/userProfileService";
import { userProfilePayloadSchema } from "@/features/telegram-user/schemas/userProfile";
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

export const userRouter = router({
  getProfile: publicProcedure
    .input(z.object({ telegramUserId: telegramUserIdSchema }))
    .query(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      assertAllowedTelegramUser(input.telegramUserId);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return getUserProfile(user.id);
    }),

  upsertProfile: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        payload: userProfilePayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      assertAllowedTelegramUser(input.telegramUserId);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return upsertUserProfile(user.id, input.payload);
    }),

  /** Returns whether the user has filled the required profile fields.
   *  Call this on first contact (/start or first message) to decide
   *  whether to trigger the onboarding flow. */
  isProfileComplete: publicProcedure
    .input(z.object({ telegramUserId: telegramUserIdSchema }))
    .query(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      assertAllowedTelegramUser(input.telegramUserId);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return getProfileCompleteness(user.id);
    }),
});
