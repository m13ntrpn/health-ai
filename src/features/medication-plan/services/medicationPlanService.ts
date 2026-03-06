import { prisma } from "@/shared/lib/prisma";
import type { MedicationPlan } from "@/generated/prisma/client";
import type { MedicationPlanPayload } from "../schemas/medicationPlan";

export interface ListMedicationPlansResult {
  plans: MedicationPlan[];
  nextCursor: string | null;
}

export async function addMedicationPlan(
  userId: string,
  payload: MedicationPlanPayload,
): Promise<MedicationPlan> {
  return prisma.medicationPlan.create({
    data: {
      userId,
      name: payload.name,
      dose: payload.dose ?? undefined,
      schedule: payload.schedule ?? undefined,
      startDate: payload.startDate ?? undefined,
      endDate: payload.endDate ?? undefined,
    },
  });
}

export async function listMedicationPlans(
  userId: string,
  limit: number,
  cursor?: string | null,
): Promise<ListMedicationPlansResult> {
  const rows = await prisma.medicationPlan.findMany({
    where: { userId },
    orderBy: [{ endDate: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const hasMore = rows.length > limit;
  const plans = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? plans[plans.length - 1]!.id : null;

  return { plans, nextCursor };
}

