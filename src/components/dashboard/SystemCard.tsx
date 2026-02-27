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
import { ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Step-to-stage mapping
// ---------------------------------------------------------------------------

function getStageLabel(step: number): string {
  if (step <= 2) return "Gathering info";
  if (step <= 3) return "Analyzing niches";
  if (step <= 4) return "Choosing niche";
  if (step <= 6) return "Building offer";
  if (step <= 8) return "Generating system";
  return "Finishing up";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
}

export function SystemCard({
  id,
  status,
  currentStep,
  offer,
  chosenRecommendation,
  currencySymbol,
}: SystemCardProps) {
  const isComplete = status === "complete";

  // Derive the best title available
  const title = offer?.system_description
    ?? chosenRecommendation?.niche
    ?? "System in progress";

  // Derive the best description available
  const description = offer?.segment
    ?? (chosenRecommendation?.niche ? "Niche selected" : "Setting up...");

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={
              isComplete
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            }
          >
            {isComplete ? "Live" : getStageLabel(currentStep)}
          </Badge>
        </div>
        <CardTitle className="mt-2 text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {offer?.pricing_monthly != null && (
            <span className="text-sm font-mono text-muted-foreground">
              {currencySymbol}{offer.pricing_monthly}/mo
            </span>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={
                isComplete
                  ? `/dashboard/systems/${id}`
                  : `/start/${id}`
              }
            >
              {isComplete ? "View System" : "Continue"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
