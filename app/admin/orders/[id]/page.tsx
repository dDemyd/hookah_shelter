export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Замовлення #{id}</h1>
      <p className="mt-2 text-muted-foreground">TODO: деталі замовлення.</p>
    </div>
  );
}
