import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

function getStageLabel(
  offer: SystemCardProps["offer"],
  chosenRecommendation: SystemCardProps["chosenRecommendation"]
): string {
  if (offer?.system_description) return "Finishing up";
  if (chosenRecommendation?.niche) return "Building offer";
  return "Getting started";
}

interface SystemCardProps {
  id: string;
  status: string;
  currentStep: number;
  offer: {
    system_description?: string;
    segment?: string;
    pricing_monthly?: number;
  } | null;
  chosenRecommendation: {
    niche?: string;
  } | null;
  currencySymbol: string;
  leadsCount?: number;
}

export function SystemCard({
  id,
  status,
  offer,
  chosenRecommendation,
  currencySymbol,
  leadsCount,
}: SystemCardProps) {
  const isComplete = status === "complete";

  const title =
    offer?.system_description ??
    chosenRecommendation?.niche ??
    "New Business";

  const description =
    offer?.segment ??
    (chosenRecommendation?.niche ? "Niche selected" : "Setting up...");

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={
              isComplete
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            }
          >
            {isComplete ? "Live" : getStageLabel(offer, chosenRecommendation)}
          </Badge>
        </div>
        <CardTitle className="mt-2 text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {offer?.pricing_monthly != null && (
              <span className="text-sm font-mono text-muted-foreground">
                {currencySymbol}
                {offer.pricing_monthly}/mo
              </span>
            )}
            {leadsCount != null && leadsCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                {leadsCount} lead{leadsCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={
                isComplete
                  ? `/dashboard/systems/${id}`
                  : `/dashboard/systems/${id}/chat`
              }
            >
              {isComplete ? "View" : "Continue"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
