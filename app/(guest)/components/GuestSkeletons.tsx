import { Skeleton } from "@/components/ui/skeleton";

export function CatalogGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4" aria-label="Завантажую каталог">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-shelter-card border border-shelter-border bg-shelter-surface"
        >
          <Skeleton className="aspect-square rounded-none bg-white/[0.05]" />
          <div className="space-y-2.5 p-3">
            <Skeleton className="h-2.5 w-16 bg-white/[0.06]" />
            <Skeleton className="h-4 w-full bg-white/[0.06]" />
            <Skeleton className="h-3 w-24 bg-white/[0.06]" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded bg-white/[0.06]" />
              <Skeleton className="size-11 rounded-shelter-control bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PresetListSkeleton() {
  return (
    <div className="grid gap-3" aria-label="Завантажую фірмові мікси">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[18px] border border-shelter-border bg-shelter-surface"
        >
          <Skeleton className="h-[220px] rounded-none bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

export function OrdersListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4" aria-label="Завантажую замовлення">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[16px] border border-shelter-border bg-shelter-surface p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36 bg-white/[0.06]" />
              <Skeleton className="h-3 w-28 bg-white/[0.06]" />
            </div>
            <Skeleton className="h-6 w-20 rounded bg-white/[0.06]" />
          </div>
          <Skeleton className="h-2 w-full rounded-full bg-white/[0.06]" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Skeleton className="h-7 w-24 rounded-full bg-white/[0.06]" />
            <Skeleton className="h-7 w-20 rounded-full bg-white/[0.06]" />
            <Skeleton className="h-7 w-28 rounded-full bg-white/[0.06]" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Skeleton className="size-9 rounded-shelter-control bg-white/[0.06]" />
            <Skeleton className="h-9 w-24 rounded-shelter-control bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
