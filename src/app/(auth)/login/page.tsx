import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Log in</CardTitle>
          <CardDescription>
            Sign in to your LaunchPath account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Auth UI and Supabase sign-in will go here. Configure in Supabase
            Dashboard → Authentication.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
