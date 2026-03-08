"use client";

import { useState } from "react";
import { trpcClient } from "@/shared/api/trpcClient";
import type {
  DailyLogPayload,
  MealPayload,
  IntakeItemPayload,
  ActivityLogPayload,
} from "@/features/health-log/schemas/dailyLog";


type LogWithRelations = {
  id: string;
  userId: string;
  date: Date;
  mood: string | null;
  comment: string | null;
  isCompleted: boolean;
  waterMl?: number | null;
  meals?: Array<{
    type?: string | null;
    time?: Date | null;
    description?: string | null;
    calories?: number | null;
    proteinG?: unknown;
    fatG?: unknown;
    carbsG?: unknown;
  }>;
  intakes?: Array<{
    name: string;
    dose?: string | null;
    time?: Date | null;
    category?: string | null;
  }>;
  sleepLogs?: Array<{
    start?: Date | null;
    end?: Date | null;
    quality?: string | null;
  }>;
  activityLogs?: Array<{
    type?: string | null;
    durationMin?: number | null;
    intensity?: string | null;
  }>;
};

function logToPayload(log: LogWithRelations): DailyLogPayload {
  return {
    mood: log.mood ?? undefined,
    comment: log.comment ?? undefined,
    isCompleted: log.isCompleted ?? false,
    waterMl: log.waterMl ?? undefined,
    meals: log.meals?.map((m) => ({
      type: (m.type ?? undefined) as MealPayload["type"],
      time: m.time ?? undefined,
      description: m.description ?? undefined,
      calories: m.calories ?? undefined,
      proteinG: m.proteinG != null ? Number(m.proteinG) : undefined,
      fatG: m.fatG != null ? Number(m.fatG) : undefined,
      carbsG: m.carbsG != null ? Number(m.carbsG) : undefined,
    })) ?? [],
    intakes: log.intakes?.map((i) => ({
      name: i.name,
      dose: i.dose ?? undefined,
      time: i.time ?? undefined,
      category: (i.category ?? undefined) as IntakeItemPayload["category"],
    })) ?? [],
    sleepLogs: log.sleepLogs?.map((s) => ({
      start: s.start ?? undefined,
      end: s.end ?? undefined,
      quality: s.quality ?? undefined,
    })) ?? [],
    activityLogs: log.activityLogs?.map((a) => ({
      type: a.type ?? undefined,
      durationMin: a.durationMin ?? undefined,
      intensity: (a.intensity ?? undefined) as ActivityLogPayload["intensity"],
    })) ?? [],
  };
}

const inputCls =
  "w-full rounded border border-neutral-300 dark:border-neutral-600 bg-transparent px-2 py-1 text-sm";
const selectCls = inputCls;
const sectionCls =
  "rounded border border-neutral-200 dark:border-neutral-700 p-3 space-y-3";
const removeBtnCls =
  "text-xs text-red-500 hover:text-red-700 mt-1 self-start";
const addBtnCls =
  "text-xs rounded border border-neutral-300 dark:border-neutral-600 px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800";

function toDatetimeLocal(d?: Date | null): string {
  if (!d) return "";
  // Format as YYYY-MM-DDTHH:MM for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

// --- Sub-components ---

function MealsSection({
  meals,
  onChange,
}: {
  meals: MealPayload[];
  onChange: (meals: MealPayload[]) => void;
}) {
  const addMeal = () =>
    onChange([...meals, { type: "other", description: "", calories: undefined }]);
  const removeMeal = (i: number) => onChange(meals.filter((_, idx) => idx !== i));
  const updateMeal = (i: number, patch: Partial<MealPayload>) =>
    onChange(meals.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  return (
    <details className={sectionCls}>
      <summary className="cursor-pointer text-sm font-medium">
        Meals ({meals.length})
      </summary>
      <div className="space-y-3 mt-2">
        {meals.map((meal, i) => (
          <div key={i} className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-neutral-500 mb-0.5">Type</label>
                <select
                  value={meal.type ?? "other"}
                  onChange={(e) => updateMeal(i, { type: e.target.value as MealPayload["type"] })}
                  className={selectCls}
                >
                  {["breakfast", "lunch", "dinner", "snack", "other"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-0.5">Calories</label>
                <input
                  type="number"
                  min={0}
                  value={meal.calories ?? ""}
                  onChange={(e) =>
                    updateMeal(i, { calories: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-0.5">Description</label>
              <input
                type="text"
                value={meal.description ?? ""}
                onChange={(e) => updateMeal(i, { description: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["proteinG", "fatG", "carbsG"] as const).map((macro) => (
                <div key={macro}>
                  <label className="block text-xs text-neutral-500 mb-0.5">
                    {macro === "proteinG" ? "Protein g" : macro === "fatG" ? "Fat g" : "Carbs g"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={meal[macro] ?? ""}
                    onChange={(e) =>
                      updateMeal(i, { [macro]: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => removeMeal(i)} className={removeBtnCls}>
              Remove meal
            </button>
          </div>
        ))}
        <button type="button" onClick={addMeal} className={addBtnCls}>
          + Add meal
        </button>
      </div>
    </details>
  );
}

function SleepSection({
  sleepLogs,
  onChange,
}: {
  sleepLogs: DailyLogPayload["sleepLogs"];
  onChange: (s: DailyLogPayload["sleepLogs"]) => void;
}) {
  const sleep = sleepLogs?.[0] ?? {};
  const update = (patch: typeof sleep) => {
    const updated = { ...sleep, ...patch };
    onChange([updated]);
  };

  return (
    <details className={sectionCls}>
      <summary className="cursor-pointer text-sm font-medium">Sleep</summary>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="block text-xs text-neutral-500 mb-0.5">Start</label>
          <input
            type="datetime-local"
            value={toDatetimeLocal(sleep.start ?? null)}
            onChange={(e) => update({ start: fromDatetimeLocal(e.target.value) })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-0.5">End</label>
          <input
            type="datetime-local"
            value={toDatetimeLocal(sleep.end ?? null)}
            onChange={(e) => update({ end: fromDatetimeLocal(e.target.value) })}
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-neutral-500 mb-0.5">Quality</label>
          <select
            value={sleep.quality ?? ""}
            onChange={(e) => update({ quality: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">— select —</option>
            {["great", "good", "ok", "poor", "terrible"].map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>
    </details>
  );
}

function ActivitySection({
  activityLogs,
  onChange,
}: {
  activityLogs: ActivityLogPayload[];
  onChange: (a: ActivityLogPayload[]) => void;
}) {
  const addActivity = () => onChange([...activityLogs, { type: "", durationMin: undefined, intensity: "medium" }]);
  const removeActivity = (i: number) => onChange(activityLogs.filter((_, idx) => idx !== i));
  const updateActivity = (i: number, patch: Partial<ActivityLogPayload>) =>
    onChange(activityLogs.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  return (
    <details className={sectionCls}>
      <summary className="cursor-pointer text-sm font-medium">
        Activity ({activityLogs.length})
      </summary>
      <div className="space-y-3 mt-2">
        {activityLogs.map((activity, i) => (
          <div key={i} className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs text-neutral-500 mb-0.5">Type</label>
                <input
                  type="text"
                  placeholder="e.g. walking"
                  value={activity.type ?? ""}
                  onChange={(e) => updateActivity(i, { type: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-0.5">Duration (min)</label>
                <input
                  type="number"
                  min={0}
                  value={activity.durationMin ?? ""}
                  onChange={(e) =>
                    updateActivity(i, { durationMin: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-0.5">Intensity</label>
                <select
                  value={activity.intensity ?? "medium"}
                  onChange={(e) => updateActivity(i, { intensity: e.target.value as ActivityLogPayload["intensity"] })}
                  className={selectCls}
                >
                  {["low", "medium", "high"].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" onClick={() => removeActivity(i)} className={removeBtnCls}>
              Remove activity
            </button>
          </div>
        ))}
        <button type="button" onClick={addActivity} className={addBtnCls}>
          + Add activity
        </button>
      </div>
    </details>
  );
}

function IntakesSection({
  intakes,
  onChange,
}: {
  intakes: IntakeItemPayload[];
  onChange: (items: IntakeItemPayload[]) => void;
}) {
  const addIntake = () => onChange([...intakes, { name: "", dose: undefined, category: "other" }]);
  const removeIntake = (i: number) => onChange(intakes.filter((_, idx) => idx !== i));
  const updateIntake = (i: number, patch: Partial<IntakeItemPayload>) =>
    onChange(intakes.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  return (
    <details className={sectionCls}>
      <summary className="cursor-pointer text-sm font-medium">
        Supplements / Medications ({intakes.length})
      </summary>
      <div className="space-y-3 mt-2">
        {intakes.map((intake, i) => (
          <div key={i} className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs text-neutral-500 mb-0.5">Name *</label>
                <input
                  type="text"
                  required
                  value={intake.name}
                  onChange={(e) => updateIntake(i, { name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-0.5">Dose</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={intake.dose ?? ""}
                  onChange={(e) => updateIntake(i, { dose: e.target.value || undefined })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-0.5">Category</label>
                <select
                  value={intake.category ?? "other"}
                  onChange={(e) => updateIntake(i, { category: e.target.value as IntakeItemPayload["category"] })}
                  className={selectCls}
                >
                  {["vitamin", "medicine", "other"].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" onClick={() => removeIntake(i)} className={removeBtnCls}>
              Remove intake
            </button>
          </div>
        ))}
        <button type="button" onClick={addIntake} className={addBtnCls}>
          + Add intake
        </button>
      </div>
    </details>
  );
}

// --- Main editor ---

export function DailyLogEditor({
  dateStr,
  initialLog,
}: {
  dateStr: string;
  initialLog: LogWithRelations | null;
}) {
  const [payload, setPayload] = useState<DailyLogPayload>(
    initialLog
      ? logToPayload(initialLog)
      : { mood: "", comment: "", isCompleted: false, waterMl: undefined, meals: [], intakes: [], sleepLogs: [], activityLogs: [] },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await trpcClient.healthLog.upsertDailyLog.mutate({
        date: dateStr,
        payload: {
          mood: payload.mood || undefined,
          comment: payload.comment || undefined,
          isCompleted: payload.isCompleted,
          waterMl: payload.waterMl ?? undefined,
          meals: payload.meals ?? [],
          intakes: payload.intakes ?? [],
          sleepLogs: payload.sleepLogs ?? [],
          activityLogs: payload.activityLogs ?? [],
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {/* Core fields */}
      <div>
        <label className="block text-sm font-medium mb-1">Mood</label>
        <input
          type="text"
          value={payload.mood ?? ""}
          onChange={(e) => setPayload((p) => ({ ...p, mood: e.target.value }))}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Comment</label>
        <textarea
          value={payload.comment ?? ""}
          onChange={(e) => setPayload((p) => ({ ...p, comment: e.target.value }))}
          rows={3}
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="completed"
          checked={payload.isCompleted ?? false}
          onChange={(e) => setPayload((p) => ({ ...p, isCompleted: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="completed" className="text-sm">Day completed</label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Water (ml)</label>
        <input
          type="number"
          min={0}
          step={50}
          value={payload.waterMl ?? ""}
          onChange={(e) =>
            setPayload((p) => ({
              ...p,
              waterMl: e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
          placeholder="e.g. 2000"
          className={inputCls}
        />
      </div>

      {/* Collapsible sections */}
      <MealsSection
        meals={payload.meals ?? []}
        onChange={(meals) => setPayload((p) => ({ ...p, meals }))}
      />
      <SleepSection
        sleepLogs={payload.sleepLogs ?? []}
        onChange={(sleepLogs) => setPayload((p) => ({ ...p, sleepLogs }))}
      />
      <ActivitySection
        activityLogs={payload.activityLogs ?? []}
        onChange={(activityLogs) => setPayload((p) => ({ ...p, activityLogs }))}
      />
      <IntakesSection
        intakes={payload.intakes ?? []}
        onChange={(intakes) => setPayload((p) => ({ ...p, intakes }))}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
