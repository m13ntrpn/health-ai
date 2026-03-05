import Link from "next/link";
import { DailyLogList } from "@/features/health-log/components/DailyLogList";

export default function LogsPage() {
  return (
    <main className="min-h-screen p-6">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Home
        </Link>
        <Link href="/logs" className="font-medium">
          Logs
        </Link>
        <Link href="/dashboard" className="text-neutral-600 dark:text-neutral-400 hover:underline">
          Dashboard
        </Link>
      </nav>
      <h1 className="text-xl font-semibold mb-4">Daily logs</h1>
      <DailyLogList />
    </main>
  );
}
