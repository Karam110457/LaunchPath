import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api/validate";

/**
 * Public health check for load balancers. No auth. No sensitive data.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
