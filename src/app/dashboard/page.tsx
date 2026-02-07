import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your LaunchPath workspace. Add protected routes and data here.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>
              Add auth checks with createClient() from @/lib/supabase/server
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>
              Use Supabase tables and RLS. Generate types with Supabase CLI.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Realtime</CardTitle>
            <CardDescription>
              Subscribe to changes with supabase.channel() in client components.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
