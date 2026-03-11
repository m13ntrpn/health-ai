import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 px-4">
        <h1 className="text-xl font-semibold">Log in</h1>
        <LoginForm />
      </div>
    </main>
  );
}

