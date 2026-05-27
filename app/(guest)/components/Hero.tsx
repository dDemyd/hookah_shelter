import Link from "next/link";
import { CoalIcon, FlaskIcon } from "./Icon";

export function Hero() {
  return (
    <div className="relative overflow-hidden px-[22px] pt-14 pb-10">
      {/* Glowing coal ember */}
      <div
        className="animate-ember-flicker pointer-events-none absolute -top-1 -right-8 size-[180px]"
        aria-hidden
      >
        <CoalIcon size={180} />
      </div>

      <h1 className="m-0 text-[38px] leading-[1.05] font-extrabold tracking-[-1.2px] text-white text-balance">
        Збери свій
        <br />
        <span
          className="font-display text-[56px] leading-[0.9] font-semibold"
          style={{
            background:
              "linear-gradient(180deg, #ff8a3d 0%, #ff4500 60%, #8b0000 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 0,
          }}
        >
          кальян
        </span>
      </h1>

      <p
        className="mt-2.5 mb-5 max-w-[280px] text-[14.5px] leading-[1.45] text-balance"
        style={{ color: "#888" }}
      >
        Або обери з фірмових міксів бару — зібрані нашими кальянними майстрами за роки практики
      </p>

      <div className="flex gap-2.5 mt-10">
        <Link
          href="/mixer"
          className="animate-ember-pulse tap relative flex h-[52px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[14px] text-[15px] font-bold tracking-[0.2px] text-white"
          style={{
            background:
              "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)",
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <FlaskIcon size={18} />
            Створити мікс
          </span>
          {/* Glossy top sheen */}
          <span
            className="pointer-events-none absolute top-0 right-0 left-0 h-1/2"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
            }}
          />
        </Link>
        <Link
          href="/presets"
          className="tap flex h-[52px] flex-1 items-center justify-center rounded-[14px] text-[14px] font-semibold text-white"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          Фірмові мікси
        </Link>
      </div>
    </div>
  );
}
