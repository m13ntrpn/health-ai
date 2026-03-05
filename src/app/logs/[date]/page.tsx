"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DailyLogEditor } from "@/features/health-log/components/DailyLogEditor";
import { formatLogDate } from "@/features/health-log/components/formatDate";
import { trpcClient } from "@/shared/api/trpcClient";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function LogDetailPage() {
  const params = useParams();
  const dateStr = typeof params.date === "string" ? params.date : "";
  const isValidDate = DATE_REGEX.test(dateStr);

  const [log, setLog] = useState<Awaited<
    ReturnType<typeof trpcClient.healthLog.getDailyLog.query>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidDate) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setError(null);
    trpcClient.healthLog.getDailyLog
      .query({ date: dateStr })
      .then((data) => {
        if (!cancelled) setLog(data);
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
  }, [dateStr, isValidDate]);

  if (!isValidDate) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-red-600">Invalid date. Use YYYY-MM-DD.</p>
        <Link href="/logs" className="text-sm underline mt-2 inline-block">
          Back to logs
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Home
        </Link>
        <Link href="/logs" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Logs
        </Link>
        <Link href="/dashboard" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Dashboard
        </Link>
        <span className="font-medium">{formatLogDate(dateStr)}</span>
      </nav>
      <h1 className="text-xl font-semibold mb-4">{formatLogDate(dateStr)}</h1>
      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <DailyLogEditor dateStr={dateStr} initialLog={log} />
      )}
    </main>
  );
}
