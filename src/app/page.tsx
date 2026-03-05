import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-6">
      <main className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">nadin-health</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Health diary: logs, meals, sleep, activity. Use the Telegram bot or the web app.
        </p>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/logs"
            className="text-neutral-700 dark:text-neutral-300 hover:underline"
          >
            Daily logs
          </Link>
          <Link
            href="/dashboard"
            className="text-neutral-700 dark:text-neutral-300 hover:underline"
          >
            Dashboard
          </Link>
        </nav>
      </main>
    </div>
  );
}
