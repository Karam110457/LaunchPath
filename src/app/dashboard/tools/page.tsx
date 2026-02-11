import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart2, Lightbulb, RefreshCw, Search } from "lucide-react";

export default function ToolsPage() {
  const tools = [
    {
      title: "Validate Idea",
      description: "Check market viability and buyer willingness for a new concept.",
      icon: Lightbulb,
      color: "text-yellow-500",
    },
    {
      title: "Competitor Analysis",
      description: "Deep dive into competitor positioning and differentiation.",
      icon: Search,
      color: "text-blue-500",
    },
    {
      title: "Pivot Offer",
      description: "Generate alternative angles for your current offer.",
      icon: RefreshCw,
      color: "text-green-500",
    },
    {
      title: "Sales Call Prep",
      description: "Roleplay scenarios and objection handling practice.",
      icon: BarChart2, // Placeholder icon
      color: "text-purple-500",
    },
  ];

  return (
    <PageShell
      title="Tools"
      description="Advanced utilities to refine and scale your offer."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.title} className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-muted ${tool.color} bg-opacity-10`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
              </div>
              <CardTitle className="mt-4">{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
