import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Share2, Copy } from "lucide-react";

export default function OfferPage() {
  return (
    <PageShell
      title="Offer Thesis"
      description="Your core offer definition. This is the foundation of your business."
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Thesis
          </Button>
        </div>
      }
    >
      {/* Offer One-Pager */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">Offer One-Pager</CardTitle>
          <Badge variant="secondary" className="font-mono text-xs">v1.0</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-1">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Headline</h4>
            <p className="text-xl font-serif italic">
              "I help [Target Audience] achieve [Outcome] in [Timeframe] without [Pain Point]."
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Target Audience</h4>
              <div className="p-3 rounded-md bg-muted/50 border border-border/50 text-sm">
                Marketing Agencies scaling past $50k/mo who struggle with content operations.
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Core Promise</h4>
              <div className="p-3 rounded-md bg-muted/50 border border-border/50 text-sm">
                Automate 80% of client reporting and content distribution using AI agents.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Packaging */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Pricing Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
              <span className="text-sm text-muted-foreground">Setup Fee</span>
              <span className="font-mono font-medium">$2,500</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
              <span className="text-sm text-muted-foreground">Monthly Retainer</span>
              <span className="font-mono font-medium">$1,000/mo</span>
            </div>
            <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20 text-sm text-primary-foreground">
              <span className="font-medium block mb-1">Strategy Note</span>
              Start with a high-ticket setup to validate commitment, then move to recurring.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                "Custom AI Content Agent",
                "Weekly Performance Dashboard",
                "1-hour Strategy Call / mo",
                "Slack Support (Mon-Fri)"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Assumptions & Constraints */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Assumptions & Constraints</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
             <h4 className="text-sm font-medium">Constraints</h4>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
               <li>No custom code (Make/Zapier only)</li>
               <li>Max 5 clients for first cohort</li>
             </ul>
           </div>
           <div className="space-y-2">
             <h4 className="text-sm font-medium">Risks</h4>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
               <li>Client data privacy concerns</li>
               <li>Platform API changes</li>
             </ul>
           </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
