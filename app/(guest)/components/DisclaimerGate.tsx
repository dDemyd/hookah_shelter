"use client";

import { useState, useSyncExternalStore } from "react";
import { acceptDisclaimer, hasAcceptedDisclaimer } from "@/lib/utils/consent";

// useSyncExternalStore noops — same trick BottomNav uses to derive a stable
// "mounted on client" signal without an effect+setState dance.
const subscribeNoop = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Full-screen 18+ acceptance overlay. Renders on every guest page until the
 * user clicks "Підтверджую" — at which point we set a 1-year cookie and let
 * the rest of the UI through.
 *
 * SSR renders nothing (we have no way to know cookie state on the server in a
 * client component); on the client, the gate appears immediately if the
 * cookie is missing.
 */
export function DisclaimerGate() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMountedSnapshot,
    getServerSnapshot,
  );

  // Read the cookie once per render. After accept() we toggle local state and
  // unmount the gate; no need to subscribe to cookie changes.
  const [accepted, setAccepted] = useState<boolean>(() =>
    typeof document === "undefined" ? false : hasAcceptedDisclaimer(),
  );

  if (!mounted || accepted) return null;

  const accept = () => {
    acceptDisclaimer();
    setAccepted(true);
  };

  const decline = () => {
    // Friendly redirect for under-18s — no acceptance is recorded, so the
    // gate will reappear if they navigate back.
    window.location.href =
      "https://youtu.be/d_mz-fPShi0?si=_O4YYZAaK0TlpVLg";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-5 py-6"
      style={{
        background: "rgba(5, 5, 5, 0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[22px] border p-6"
        style={{
          background: "#141010",
          borderColor: "rgba(255,69,0,0.25)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(255,69,0,0.18), 0 20px 60px rgba(0,0,0,0.65)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-12 -right-12 size-48 opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(255,138,61,0.4), transparent 70%)",
            filter: "blur(20px)",
          }}
          aria-hidden
        />

        <div className="relative">
          <div className="mb-2 text-[11px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
            Сховище · 18+
          </div>
          <h2
            id="disclaimer-title"
            className="m-0 text-[24px] leading-tight font-extrabold text-white"
          >
            Перш ніж зайти
          </h2>

          <div className="mt-4 space-y-3 text-[13.5px] leading-[1.55] text-[#cfcfcf]">
            <p>
              Цей застосунок призначений виключно для осіб віком{" "}
              <strong className="text-white">від 18 років</strong>.
            </p>
            <p>
              Куріння кальяну шкодить вашому здоров&apos;ю та може викликати залежність.
              Вживання тютюну під час вагітності — небезпечне для дитини.
            </p>
            <p className="text-[#888]">
              Натискаючи кнопку нижче, ти підтверджуєш, що тобі вже виповнилося 18,
              ти усвідомлюєш ризики й береш на себе всю відповідальність за рішення
              користуватися сервісом.
            </p>
          </div>

          <button
            type="button"
            onClick={accept}
            className="tap mt-6 flex h-[54px] w-full items-center justify-center rounded-[16px] text-[15px] font-extrabold text-white"
            style={{
              background:
                "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)",
              boxShadow: "0 10px 28px rgba(255,69,0,0.4)",
            }}
          >
            Мені 18+, підтверджую
          </button>
          <button
            type="button"
            onClick={decline}
            className="tap mt-2 flex h-[48px] w-full items-center justify-center rounded-[14px] text-[13.5px] font-semibold text-[#aaa] transition-colors hover:text-white"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Ні, мені немає 18-ти років 😭
          </button>
          <p className="mt-3 text-center text-[11px] text-[#666]">
            Вибір зберігається у цьому браузері на рік.
          </p>
        </div>
      </div>
    </div>
  );
}
