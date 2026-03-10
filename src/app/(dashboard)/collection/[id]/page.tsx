import { CollectionDetailClient } from "@/features/collection/components";
import { AddCardDialog } from "./add-card-dialog";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params in a server component wrapper, then delegate to client
  return <CollectionDetailWrapper params={params} />;
}

async function CollectionDetailWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetailClient id={id} AddCardDialog={AddCardDialog} />;
}
