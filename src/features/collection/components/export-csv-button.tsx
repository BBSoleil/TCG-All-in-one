"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCSVButton({ collectionId }: { collectionId: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/collection/${collectionId}/export`, "_blank")}
    >
      <Download className="mr-1 h-4 w-4" />
      Export CSV
    </Button>
  );
}
