import { Suspense } from "react";
import { NewOrderClient } from "./NewOrderClient";

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="h-dvh" />}>
      <NewOrderClient />
    </Suspense>
  );
}
