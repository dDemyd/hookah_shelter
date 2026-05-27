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
  Menu,
} from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.replace("/admin/login");
    router.refresh();
  };

  const current = items.find(({ href }) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href),
  );

  return (
    <div className="md:hidden">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-sm leading-none text-muted-foreground">
              Сховище
            </p>
            <p className="truncate text-base font-semibold">
              {current?.label ?? "Адмін-панель"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => setOpen(true)}
            aria-label="Відкрити меню"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[86vw] max-w-sm p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Адмін-навігація</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {items.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
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
          <div className="mt-auto border-t p-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={signOut}
            >
              <LogOut className="size-4" />
              Вийти
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
