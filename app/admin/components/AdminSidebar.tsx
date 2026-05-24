"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Flame,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Замовлення", icon: ClipboardList },
  { href: "/admin/tobaccos", label: "Тютюни", icon: Flame },
  { href: "/admin/presets", label: "Фірмові", icon: Sparkles },
  { href: "/admin/brands", label: "Бренди", icon: Tag },
  { href: "/admin/categories", label: "Категорії", icon: FolderTree },
  { href: "/admin/users", label: "Користувачі", icon: Users },
  { href: "/admin/stats", label: "Статистика", icon: BarChart3 },
  { href: "/admin/settings", label: "Налаштування", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/50 p-4 md:flex">
      <div className="mb-6 px-2">
        <p className="font-display text-lg text-muted-foreground">Сховище</p>
        <p className="text-sm font-semibold">Адмін-панель</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={signOut}
        className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        <LogOut className="size-4" />
        Вийти
      </button>
    </aside>
  );
}
