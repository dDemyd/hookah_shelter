import type { ReactNode } from "react";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "./components/BottomNav";
import { SmokeLayer } from "./components/SmokeLayer";
import { TableParamCapture } from "./components/TableParamCapture";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#0a0a0a]">
      {/* Fixed atmospheric layer behind all guest content. */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <SmokeLayer opacity={0.7} />
      </div>

      <main className="relative z-10 flex-1 pb-24">{children}</main>
      <Suspense fallback={null}>
        <TableParamCapture />
      </Suspense>
      <BottomNav />
      <Toaster
        position="bottom-center"
        offset={108}
        toastOptions={{
          style: {
            background: "rgba(20,12,12,0.95)",
            border: "1px solid rgba(255,69,0,0.4)",
            color: "#fff",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 24px rgba(255,69,0,0.25), 0 4px 12px rgba(0,0,0,0.5)",
          },
        }}
      />
    </div>
  );
}
