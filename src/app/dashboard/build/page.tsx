import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Layers, FileText, Download } from "lucide-react";

export default function BuildPage() {
  return (
    <PageShell
      title="Delivery System"
      description="The blueprint for building and delivering your offer."
      action={
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Plan
        </Button>
      }
    >
      <Tabs defaultValue="stack" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stack">Tool Stack</TabsTrigger>
          <TabsTrigger value="checklist">Implementation Checklist</TabsTrigger>
          <TabsTrigger value="sops">SOPs</TabsTrigger>
        </TabsList>

        <TabsContent value="stack" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "OpenAI API", type: "Intelligence", cost: "Usage-based" },
              { name: "Make.com", type: "Automation", cost: "$29/mo" },
              { name: "Airtable", type: "Database", cost: "$20/mo" },
            ].map((tool, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{tool.cost}</span>
                  </div>
                  <CardTitle className="mt-2">{tool.name}</CardTitle>
                  <CardDescription>{tool.type}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Phase 1: Core Infrastructure</CardTitle>
              <CardDescription>Estimated time: 4 hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Set up Airtable base structure",
                "Configure OpenAI API keys in Make",
                "Build 'Ingest' scenario",
                "Build 'Process' scenario",
                "Test end-to-end flow with dummy data"
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                  <div className="h-5 w-5 rounded border border-primary/50 flex items-center justify-center cursor-pointer">
                    {i < 2 && <div className="h-3 w-3 bg-primary rounded-sm" />}
                  </div>
                  <span className={i < 2 ? "line-through text-muted-foreground" : ""}>{task}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sops">
          <div className="grid gap-4">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <h3 className="font-medium">Client Onboarding SOP</h3>
                <p className="text-sm text-muted-foreground">Click to view generated procedure</p>
              </CardContent>
            </Card>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <h3 className="font-medium">Weekly Reporting SOP</h3>
                <p className="text-sm text-muted-foreground">Click to view generated procedure</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
