import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, MessageSquare, Phone, Users } from "lucide-react";
import { STAGE_LABELS } from "@/lib/constants/stages";

export default function SellPage() {
  return (
    <PageShell
      title={STAGE_LABELS.sales_pack}
      description="Your go-to-market plan: scripts, targeting, and call training to get your first clients."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Outreach */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Outbound Scripts
            </CardTitle>
            <CardDescription>Templates for LinkedIn/Email outreach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Cold DM (LinkedIn)</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-4 rounded-md bg-muted/50 border border-border/50 text-sm font-mono text-muted-foreground">
                "Hey [Name], saw you're running [Agency Name]. <br/><br/>
                We just built an agent that automates client reporting for agencies like yours—saves about 10h/week.<br/><br/>
                Open to a 5-min demo? No pitch, just showing the workflow."
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Targeting
            </CardTitle>
            <CardDescription>First 25 Prospects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded bg-primary/10 border border-primary/20">
                <h4 className="text-sm font-medium text-primary mb-1">Search Criteria</h4>
                <p className="text-xs text-muted-foreground">
                  "Marketing Agency Founder" AND "London" AND "11-50 employees"
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-muted-foreground">Prospect #{i}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">View</Button>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Sales Call */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Sales Call Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            {[
              { step: "Discovery", time: "5-10 min", desc: "Diagnose current pain points." },
              { step: "Demo", time: "15 min", desc: "Show the 'Process' scenario in Make." },
              { step: "Close", time: "5 min", desc: "Propose the pilot offer ($2.5k)." }
            ].map((phase, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{phase.step}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{phase.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{phase.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
