"use client";

import { useState } from "react";
import { Save, Unlink, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  role: "admin" | "kalyanchik" | null;
  is_active: boolean;
  user_telegram_id: number | null;
  has_profile: boolean;
};

type Draft = Pick<AdminUser, "full_name" | "role" | "is_active">;

function formatDate(value: string | null): string {
  if (!value) return "Ніколи";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function UsersClient() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      const payload = (await response.json()) as { users?: AdminUser[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не вдалося завантажити користувачів.");
      return payload.users ?? [];
    },
  });

  const saveUser = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: Draft }) => {
      if (!draft.role) throw new Error("Оберіть роль.");
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...draft }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не вдалося зберегти користувача.");
    },
    onSuccess: async () => {
      setDrafts({});
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      window.location.reload();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося зберегти користувача.");
    },
  });

  const unlinkTelegram = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, unlinkTelegram: true }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не вдалося відвʼязати Telegram.");
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося відвʼязати Telegram.");
    },
  });

  const updateDraft = (user: AdminUser, patch: Partial<Draft>) => {
    const baseDraft = currentDraft(user);
    setDrafts((current) => ({
      ...current,
      [user.id]: {
        ...baseDraft,
        ...patch,
      },
    }));
  };

  const currentDraft = (user: AdminUser): Draft => ({
    ...(drafts[user.id] ?? {
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    }),
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Користувачі</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Існуючі auth users та їх ролі в адмінці.</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[220px_200px_150px_180px_120px_100px] gap-3 border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
            <span>Користувач</span>
            <span>Імʼя</span>
            <span>Роль</span>
            <span>Статус привʼязки</span>
            <span>Вхід</span>
            <span className="text-right">Дії</span>
          </div>
          {usersQuery.data?.map((user) => {
            const draft = currentDraft(user);
            return (
              <div key={user.id} className="grid grid-cols-[220px_200px_150px_180px_120px_100px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <div>
                  <p className="truncate font-medium">{user.email || user.id}</p>
                  <div className="mt-1 flex gap-1">
                    {user.has_profile ? <Badge variant="secondary">Профіль</Badge> : <Badge variant="outline">Без ролі</Badge>}
                    {!draft.is_active ? <Badge variant="outline">Вимкнено</Badge> : null}
                  </div>
                </div>
                <Input value={draft.full_name} onChange={(event) => updateDraft(user, { full_name: event.target.value })} />
                <select className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" value={draft.role ?? ""} onChange={(event) => updateDraft(user, { role: (event.target.value || null) as Draft["role"] })}>
                  <option value="">Без ролі</option>
                  <option value="kalyanchik">Кальянщик</option>
                  <option value="admin">Адмін</option>
                </select>
                <div className="space-y-1 text-sm">
                  {user.user_telegram_id ? (
                    <>
                      <Badge variant="secondary">Привʼязано</Badge>
                      <p className="text-xs text-muted-foreground">
                        ID {user.user_telegram_id}
                      </p>
                      <Button
                        size="xs"
                        variant="outline"
                        className="gap-1"
                        disabled={unlinkTelegram.isPending}
                        onClick={() => unlinkTelegram.mutate(user.id)}
                      >
                        <Unlink className="size-3" />
                        Відвʼязати
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">Не привʼязано</Badge>
                      <p className="text-xs text-muted-foreground">
                        Надішліть email боту
                      </p>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{formatDate(user.last_sign_in_at)}</p>
                  <label className="mt-1 flex items-center gap-2">
                    <input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft(user, { is_active: event.target.checked })} />
                    Активний
                  </label>
                </div>
                <div className="flex justify-end">
                  <Button size="icon-sm" variant="ghost" aria-label="Зберегти" onClick={() => saveUser.mutate({ id: user.id, draft })}>
                    <Save className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {usersQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Завантаження...</p> : null}
        </div>
      </div>
    </div>
  );
}
