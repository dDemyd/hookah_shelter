"use client";

type Props = {
  label: string;
  value: string;
  onClick?: () => void;
};

export function DropdownTrigger({ label, value, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap flex flex-1 min-w-0 items-center justify-between gap-1.5 rounded-[10px] px-2.5 py-2 text-left text-white"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-px text-[9px] font-semibold uppercase tracking-[1px] text-[#888]">
          {label}
        </div>
        <div className="overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap text-white">
          {value}
        </div>
      </div>
      <svg width="10" height="10" viewBox="0 0 12 12" className="shrink-0 text-[#888]">
        <path
          d="M2 4l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
