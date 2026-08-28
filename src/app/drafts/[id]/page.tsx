import { StudioPage } from "../../studio-page";

export default async function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudioPage view="editor" draftId={id} />;
}
