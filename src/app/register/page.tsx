import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 px-4">
        <h1 className="text-xl font-semibold">Create account</h1>
        <RegisterForm />
      </div>
    </main>
  );
}

