"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { debugAction } from "./action";

export default function DebugPage() {
  const [result, setResult] = useState<string>("Not tested yet");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8">
      <h1 className="text-2xl font-bold">Debug Page</h1>

      <div className="space-y-2">
        <h2 className="font-semibold">1. Toast Test</h2>
        <Button onClick={() => toast.success("Toast works!")}>
          Fire Success Toast
        </Button>
        <Button variant="destructive" onClick={() => toast.error("Error toast works!")}>
          Fire Error Toast
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">2. Server Action Test</h2>
        <Button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                const res = await debugAction();
                setResult(JSON.stringify(res, null, 2));
                if (res.error) {
                  toast.error(String(res.error));
                } else {
                  toast.success("Server action succeeded!");
                }
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setResult(`THROWN: ${msg}`);
                toast.error(`Action threw: ${msg}`);
              }
            });
          }}
        >
          {isPending ? "Calling..." : "Call Server Action"}
        </Button>
        <pre className="rounded bg-muted p-3 text-xs whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
}
