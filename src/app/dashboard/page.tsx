"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpcClient } from "@/shared/api/trpcClient";

function formatDateRange(from: string, to: string): string {
  const f = new Date(from + "T12:00:00Z");
  const t = new Date(to + "T12:00:00Z");
  return `${f.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} – ${t.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function DashboardPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState<{
    totalCalories: number;
    completedDaysCount: number;
    daysWithLogsCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(to.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!fromDate || !toDate || fromDate > toDate) return;
    let cancelled = false;
    setError(null);
    setLoading(true);
    trpcClient.healthLog.summary
      .query({ fromDate, toDate })
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate]);

  return (
    <main className="min-h-screen p-6">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Home
        </Link>
        <Link href="/logs" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Logs
        </Link>
        <span className="font-medium">Dashboard</span>
      </nav>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {loading && <p className="text-sm text-neutral-500">Loading…</p>}
        {summary && !loading && (
          <div className="space-y-4 max-w-md">
            <p className="text-sm text-neutral-500">
              {formatDateRange(fromDate, toDate)}
            </p>
            <ul className="space-y-2">
              <li className="flex justify-between rounded border border-neutral-200 dark:border-neutral-700 px-4 py-3">
                <span className="text-neutral-600 dark:text-neutral-400">Total calories</span>
                <span className="font-medium">{summary.totalCalories}</span>
              </li>
              <li className="flex justify-between rounded border border-neutral-200 dark:border-neutral-700 px-4 py-3">
                <span className="text-neutral-600 dark:text-neutral-400">Days with logs</span>
                <span className="font-medium">{summary.daysWithLogsCount}</span>
              </li>
              <li className="flex justify-between rounded border border-neutral-200 dark:border-neutral-700 px-4 py-3">
                <span className="text-neutral-600 dark:text-neutral-400">Days completed</span>
                <span className="font-medium">{summary.completedDaysCount}</span>
              </li>
            </ul>
          </div>
        )}
      </main>
  );
}
