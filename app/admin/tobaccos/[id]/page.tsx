import { TobaccoForm } from "../TobaccoForm";

export default async function EditTobaccoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TobaccoForm tobaccoId={id} />;
}
