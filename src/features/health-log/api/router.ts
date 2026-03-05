import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/api/trpc";
import {
  getDailyLogByDate,
  getSimpleSummary,
  listDailyLogs,
  upsertDailyLog,
} from "@/features/health-log/services/dailyLogService";
import {
  dateStringSchema,
  dailyLogPayloadSchema,
} from "@/features/health-log/schemas/dailyLog";
import { ensureUserByTelegramId } from "@/features/telegram-user/services/ensureUserByTelegramId";
import { generateHealthReport } from "@/features/health-log/services/reportService";

const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional().nullable(),
});

/** Procedures for service callers: require X-Service-Token (ctx.serviceAuth) and telegramUserId in input. */
function assertServiceAuth(ctx: { serviceAuth: boolean }): void {
  if (!ctx.serviceAuth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Service token required (X-Service-Token header)",
    });
  }
}

const telegramUserIdSchema = z.string().min(1, "telegramUserId is required");

/** Resolve userId for web UI: uses DEFAULT_TELEGRAM_USER_ID from env (single-user mode). */
async function resolveWebUserId(): Promise<string> {
  const telegramId = process.env.DEFAULT_TELEGRAM_USER_ID;
  if (!telegramId?.trim()) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "DEFAULT_TELEGRAM_USER_ID is not set. Set it in .env for web UI, or use the Telegram bot with X-Service-Token.",
    });
  }
  const user = await ensureUserByTelegramId(telegramId.trim());
  return user.id;
}

export const healthLogRouter = router({
  getDailyLog: publicProcedure
    .input(z.object({ date: dateStringSchema }))
    .query(async ({ input }) => {
      const userId = await resolveWebUserId();
      return getDailyLogByDate(userId, input.date);
    }),

  listDailyLogs: publicProcedure
    .input(paginationSchema)
    .query(async ({ input }) => {
      const userId = await resolveWebUserId();
      return listDailyLogs({
        userId,
        limit: input.limit,
        cursor: input.cursor,
      });
    }),

  upsertDailyLog: publicProcedure
    .input(
      z.object({
        date: dateStringSchema,
        payload: dailyLogPayloadSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const userId = await resolveWebUserId();
      return upsertDailyLog(userId, input.date, input.payload);
    }),

  summary: publicProcedure
    .input(
      z.object({
        fromDate: dateStringSchema,
        toDate: dateStringSchema,
      }),
    )
    .query(async ({ input }) => {
      const userId = await resolveWebUserId();
      return getSimpleSummary({
        userId,
        fromDate: input.fromDate,
        toDate: input.toDate,
      });
    }),

  // --- Service-only procedures (OpenClaw with X-Service-Token + telegramUserId) ---

  getDailyLogForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        date: dateStringSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return getDailyLogByDate(user.id, input.date);
    }),

  listDailyLogsForTelegramUser: publicProcedure
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
      return listDailyLogs({
        userId: user.id,
        limit: input.limit,
        cursor: input.cursor,
      });
    }),

  upsertDailyLogForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        date: dateStringSchema,
        payload: dailyLogPayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return upsertDailyLog(user.id, input.date, input.payload);
    }),

  summaryForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        fromDate: dateStringSchema,
        toDate: dateStringSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      return getSimpleSummary({
        userId: user.id,
        fromDate: input.fromDate,
        toDate: input.toDate,
      });
    }),

  reportForTelegramUser: publicProcedure
    .input(
      z.object({
        telegramUserId: telegramUserIdSchema,
        fromDate: dateStringSchema,
        toDate: dateStringSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertServiceAuth(ctx);
      const user = await ensureUserByTelegramId(input.telegramUserId);
      const profile = await import("@/features/telegram-user/services/userProfileService")
        .then((m) => m.getUserProfile(user.id));
      return generateHealthReport({
        userId: user.id,
        fromDate: input.fromDate,
        toDate: input.toDate,
        goals: profile?.goals,
      });
    }),
});
