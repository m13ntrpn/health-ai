import { router } from "./trpc";
import { healthLogRouter } from "@/features/health-log/api/router";
import { labResultRouter } from "@/features/lab-result/api/router";
import { labPanelRouter } from "@/features/lab-panel/api/router";
import { userRouter } from "@/features/telegram-user/api/router";
import { bodyMeasurementRouter } from "@/features/body-measurement/api/router";
import { medicationPlanRouter } from "@/features/medication-plan/api/router";

export const appRouter = router({
  healthLog: healthLogRouter,
  labResult: labResultRouter,
  labPanel: labPanelRouter,
  user: userRouter,
  bodyMeasurement: bodyMeasurementRouter,
  medicationPlan: medicationPlanRouter,
});

export type AppRouter = typeof appRouter;

