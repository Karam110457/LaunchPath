import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil } from "lucide-react";
import { CopyUrlButton } from "@/components/dashboard/CopyUrlButton";
import type { Submission } from "./types";

interface DemoLeadsTabProps {
  systemId: string;
  demoUrl: string | null;
  submissions: Submission[];
  totalLeads: number;
  scoreDist: { HIGH: number; MEDIUM: number; LOW: number };
}

export function DemoLeadsTab({
  systemId,
  demoUrl,
  submissions,
  totalLeads,
  scoreDist,
}: DemoLeadsTabProps) {
  return (
    <div className="space-y-6">
      {/* Demo page card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo Page</CardTitle>
          <CardDescription>
            Your AI-powered lead qualification page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo URL */}
          {demoUrl && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-1.5 min-w-0 group"
              >
                <ExternalLink className="size-3.5 shrink-0 text-primary/60 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-primary truncate hover:underline">
                  {demoUrl}
                </span>
              </a>
              <CopyUrlButton url={demoUrl} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {demoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5 mr-1.5" />
                  View Demo
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/systems/${systemId}/builder`}>
                <Pencil className="size-3.5 mr-1.5" />
                Edit in Builder
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead quality distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads</CardTitle>
          <CardDescription>
            {totalLeads} total submission{totalLeads !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalLeads > 0 ? (
            <>
              {/* Quality distribution */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Quality Distribution
                </p>
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  >
                    High: {scoreDist.HIGH}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-400 border-amber-500/20"
                  >
                    Medium: {scoreDist.MEDIUM}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-red-500/10 text-red-400 border-red-500/20"
                  >
                    Low: {scoreDist.LOW}
                  </Badge>
                </div>
              </div>

              {/* Leads table */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Recent Submissions
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, i) => {
                        const priority = (
                          sub.result as { priority?: string } | null
                        )?.priority;
                        return (
                          <tr
                            key={i}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="px-3 py-2 text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {priority ? (
                                <Badge
                                  variant="secondary"
                                  className={priorityClass(priority)}
                                >
                                  {priority}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  --
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No leads yet. Share your demo page link with prospects to start
              collecting qualified leads.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
