"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CampaignListItem {
  id: string;
  name: string;
  client_name: string | null;
  client_website: string | null;
  status: string;
  agent_id: string;
  created_at: string;
  ai_agents:
    | { name: string; personality: unknown }
    | { name: string; personality: unknown }[]
    | null;
}

interface CampaignsListProps {
  campaigns: CampaignListItem[];
}

const STATUS_STYLES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "outline" },
};

export function CampaignsList({ campaigns }: CampaignsListProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleDelete = async (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAction(`delete-${campaignId}`);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const agentData = Array.isArray(campaign.ai_agents)
          ? campaign.ai_agents[0]
          : campaign.ai_agents;
        const agentEmoji =
          (agentData?.personality as { avatar_emoji?: string } | null)
            ?.avatar_emoji ?? "\u{1F916}";
        const statusInfo =
          STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft;

        return (
          <div
            key={campaign.id}
            onClick={() =>
              router.push(`/dashboard/campaigns/${campaign.id}`)
            }
            className="cursor-pointer"
          >
            <Card className="hover:border-primary/30 hover:shadow-md transition-all h-full group relative">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-lg shrink-0">
                    <Megaphone className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{campaign.name}</h3>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {campaign.client_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {campaign.client_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1.5">
                      <span>{agentEmoji}</span>
                      <span className="truncate">
                        {agentData?.name ?? "Unknown agent"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Delete button — visible on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        disabled={loadingAction === `delete-${campaign.id}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete campaign"
                      >
                        {loadingAction === `delete-${campaign.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete &ldquo;{campaign.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes the campaign and unlinks
                          its channels. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => handleDelete(campaign.id, e)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
