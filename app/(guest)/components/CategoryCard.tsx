import Link from "next/link";
import type { CategoryCard as CategoryCardData } from "../_mock-data";

export function CategoryCard({ cat }: { cat: CategoryCardData }) {
  return (
    <Link
      href={`/catalog?cat=${cat.id}`}
      className="tap relative flex h-[96px] flex-col justify-between overflow-hidden rounded-[14px] p-3.5 text-left text-white"
      style={{
        background: `linear-gradient(135deg, ${cat.hue}22 0%, transparent 60%), #161212`,
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-5 -right-5 size-20"
        style={{
          background: `radial-gradient(circle, ${cat.hue}44, transparent 70%)`,
          filter: "blur(15px)",
        }}
      />
      <div className="relative text-[28px] leading-none">{cat.emoji}</div>
      <div className="relative">
        <div className="text-[14px] font-semibold tracking-[-0.2px]">{cat.label}</div>
        <div className="mt-0.5 text-[11px] text-[#666]">{cat.count} смаків</div>
      </div>
    </Link>
  );
}
