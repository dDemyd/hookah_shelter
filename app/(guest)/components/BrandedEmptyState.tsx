import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function BrandedEmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <div className={cn("px-[22px] pt-16 pb-8 text-center", className)}>
      <div className="relative mx-auto mb-5 flex size-24 items-center justify-center rounded-full">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,69,0,0.18),rgba(255,69,0,0.04)_48%,transparent_72%)]" />
        <svg
          viewBox="0 0 96 96"
          className="relative size-20 text-shelter-fire-bright"
          aria-hidden
        >
          <defs>
            <linearGradient id="empty-bowl-fire" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ff4500" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d="M28 32h40l-5 27a12 12 0 0 1-12 10h-6a12 12 0 0 1-12-10L28 32Z"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M25 30h46"
            stroke="url(#empty-bowl-fire)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M42 55c-7-10 6-15 2-26 10 7 14 14 10 26 5-3 8-7 8-12 7 16-4 26-14 26-9 0-16-5-16-14 3 3 6 4 10 0Z"
            fill="url(#empty-bowl-fire)"
            opacity="0.9"
          />
          <path
            d="M35 21c-5-6 7-8 3-14M50 20c-5-8 8-9 4-18M65 22c-4-5 6-7 3-12"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      <div className="mb-2 text-[17px] font-bold text-white">{title}</div>
      <div className="mx-auto max-w-[280px] text-[13px] leading-snug text-balance text-shelter-text-faint">
        {body}
      </div>
      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="shelter-cta tap mt-5 inline-flex min-h-11 items-center justify-center rounded-shelter-card px-6 text-[14px] font-bold text-white"
        >
          {actionLabel}
        </button>
      ) : actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="shelter-cta tap mt-5 inline-flex min-h-11 items-center justify-center rounded-shelter-card px-6 text-[14px] font-bold text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
