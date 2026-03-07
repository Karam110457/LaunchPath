"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssignClientDropdownProps {
  campaignId: string;
  clients: { id: string; name: string }[];
}

export function AssignClientDropdown({ campaignId, clients }: AssignClientDropdownProps) {
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);

  async function handleAssign(clientId: string) {
    setAssigning(true);
    await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId }),
    });
    router.refresh();
  }

  return (
    <select
      disabled={assigning}
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) handleAssign(e.target.value);
      }}
      onClick={(e) => e.preventDefault()}
      className="text-xs rounded border bg-background px-2 py-1 text-muted-foreground cursor-pointer disabled:opacity-50"
    >
      <option value="" disabled>
        {assigning ? "Assigning..." : "Assign to..."}
      </option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
