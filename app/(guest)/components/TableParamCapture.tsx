"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMixStore } from "@/lib/stores/mix-store";

export function TableParamCapture() {
  const searchParams = useSearchParams();
  const setTableId = useMixStore((state) => state.setTableId);

  useEffect(() => {
    const raw = searchParams.get("table");
    if (!raw) return;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setTableId(parsed);
    }
  }, [searchParams, setTableId]);

  return null;
}
