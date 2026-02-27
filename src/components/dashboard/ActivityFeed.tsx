import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Sparkles, CheckCircle2 } from "lucide-react";

export interface ActivityItem {
  type: "new_lead" | "system_created" | "system_completed";
  systemName: string;
  priority?: string;
  timestamp: Date;
}

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function priorityClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "LOW":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "";
  }
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm"
            >
              {/* Icon */}
              <div className="shrink-0">
                {item.type === "new_lead" && (
                  <UserPlus className="size-4 text-primary" />
                )}
                {item.type === "system_created" && (
                  <Sparkles className="size-4 text-yellow-500" />
                )}
                {item.type === "system_completed" && (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                {item.type === "new_lead" && (
                  <span>
                    New lead
                    {item.priority && (
                      <>
                        {" "}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] py-0 ${priorityClass(item.priority)}`}
                        >
                          {item.priority}
                        </Badge>
                      </>
                    )}{" "}
                    on{" "}
                    <span className="font-medium">{item.systemName}</span>
                  </span>
                )}
                {item.type === "system_created" && (
                  <span>
                    Started building{" "}
                    <span className="font-medium">{item.systemName}</span>
                  </span>
                )}
                {item.type === "system_completed" && (
                  <span>
                    Launched{" "}
                    <span className="font-medium">{item.systemName}</span>
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-xs text-muted-foreground shrink-0">
                {getRelativeTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
