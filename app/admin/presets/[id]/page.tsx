import { PresetForm } from "../PresetForm";

export default async function EditPresetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PresetForm presetId={id} />;
}
