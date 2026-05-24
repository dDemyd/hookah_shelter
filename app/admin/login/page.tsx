import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-3xl text-muted-foreground">Сховище</p>
          <h1 className="mt-2 text-2xl font-bold">Вхід в адмінку</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Увійдіть через обліковий запис Supabase Auth.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Доступ відкритий тільки для персоналу.
        </p>
      </div>
    </div>
  );
}
