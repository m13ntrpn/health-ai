import { router } from "./trpc";
import { healthLogRouter } from "@/features/health-log/api/router";
import { labResultRouter } from "@/features/lab-result/api/router";
import { userRouter } from "@/features/telegram-user/api/router";

export const appRouter = router({
  healthLog: healthLogRouter,
  labResult: labResultRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

