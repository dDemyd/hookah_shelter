import { ChevronIcon } from "./Icon";

type Props = {
  kicker?: string;
  title: string;
  action?: string;
  actionHref?: string;
};

export function SectionHeader({ kicker, title, action = "Усі", actionHref }: Props) {
  return (
    <div className="flex items-end justify-between px-[22px] pt-6 pb-3.5">
      <div>
        {kicker && (
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[2.4px] text-[#ff4500]">
            {kicker}
          </div>
        )}
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.5px] text-white">
          {title}
        </h2>
      </div>
      {actionHref && (
        <a
          href={actionHref}
          className="tap flex items-center gap-1 text-[13px] font-semibold text-[#888]"
        >
          {action}
          <ChevronIcon size={12} />
        </a>
      )}
    </div>
  );
}
