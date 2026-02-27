"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createSystem } from "@/app/(flows)/start/actions";

export function CreateSystemButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(async () => { await createSystem(); })}
      disabled={isPending}
    >
      <Plus className="h-4 w-4 mr-2" />
      {isPending ? "Creating..." : "New System"}
    </Button>
  );
}
