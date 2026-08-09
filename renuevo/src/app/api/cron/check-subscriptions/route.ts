import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runChecks } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.CRON_SECRET ?? "";
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!expected || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runChecks();
  return NextResponse.json(result);
}