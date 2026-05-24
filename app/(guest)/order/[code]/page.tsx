import { OrderStatusClient } from "./OrderStatusClient";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <OrderStatusClient code={code} />;
}
