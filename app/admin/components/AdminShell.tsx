"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <main className="min-h-dvh">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
