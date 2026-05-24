import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";

export default function CatalogPage() {
  // CatalogClient reads ?cat= and ?new= from useSearchParams, which requires Suspense.
  return (
    <Suspense fallback={<div className="h-dvh" />}>
      <CatalogClient />
    </Suspense>
  );
}
