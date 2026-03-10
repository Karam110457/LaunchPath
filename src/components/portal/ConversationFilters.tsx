"use client";

interface ConversationFiltersProps {
  campaigns: Array<{ id: string; name: string }>;
  campaignId: string;
  status: string;
  search: string;
  onCampaignChange: (id: string) => void;
  onStatusChange: (s: string) => void;
  onSearchChange: (s: string) => void;
}

export function ConversationFilters({
  campaigns,
  campaignId,
  status,
  search,
  onCampaignChange,
  onStatusChange,
  onSearchChange,
}: ConversationFiltersProps) {
  const selectClass =
    "px-4 py-2.5 text-sm rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150";

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={campaignId}
        onChange={(e) => onCampaignChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="human_takeover">Human Takeover</option>
        <option value="closed">Closed</option>
      </select>

      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search messages..."
        className={`${selectClass} flex-1 min-w-[200px]`}
      />
    </div>
  );
}
