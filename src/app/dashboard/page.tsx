import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { STAGE_LABELS } from "@/lib/constants/stages";

export default function DashboardPage() {
  return (
    <PageShell
      title="Overview"
      description="Welcome back. Here is your progress towards your first sellable AI offer."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Progress Cards */}
        <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Step 1</CardTitle>
            <h3 className="text-2xl font-serif italic">{STAGE_LABELS.offer_blueprint}</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-primary mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your offer is defined and validated.
            </p>
            <Button variant="outline" size="sm" className="w-full bg-background/50 backdrop-blur-sm">
              View Offer
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Step 2</CardTitle>
            <h3 className="text-2xl font-serif italic">{STAGE_LABELS.build_plan}</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-500 mb-4">
              <Clock className="h-5 w-5" />
              <span className="font-medium">In Progress</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your tool stack, checklist, and build order.
            </p>
            <Button size="sm" className="w-full">
              Continue Building <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Step 3</CardTitle>
            <h3 className="text-2xl font-serif italic">{STAGE_LABELS.sales_pack}</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Circle className="h-5 w-5" />
              <span className="font-medium">Locked</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Complete your build path to unlock scripts and get clients.
            </p>
            <Button variant="ghost" size="sm" className="w-full" disabled>
              Locked
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Next Steps */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next Actions</CardTitle>
            <CardDescription>Recommended steps to move forward</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Finalize your tool stack selection",
              "Draft your build-path SOP",
              "Review competitor analysis updates"
            ].map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="mt-0.5 h-5 w-5 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary opacity-0 hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm">{action}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tools</CardTitle>
            <CardDescription>Access your toolkit</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {["Validate Idea", "Competitor Analysis", "Pivot Offer", "Sales Prep"].map((tool) => (
              <Button key={tool} variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center text-center">
                <span className="font-medium">{tool}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
