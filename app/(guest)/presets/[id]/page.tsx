import { PresetDetailClient } from "./PresetDetailClient";

export default async function PresetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PresetDetailClient id={id} />;
}
