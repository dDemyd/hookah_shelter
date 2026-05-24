import type { ReactNode } from "react";

/** Horizontal snap-scrolling row with the design's gutters. */
export function HScroll({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return (
    <div
      className="no-scrollbar flex overflow-x-auto overflow-y-hidden px-[22px] pt-1 pb-2"
      style={{
        gap,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
      <div className="shrink-0" style={{ flex: "0 0 10px" }} />
    </div>
  );
}
