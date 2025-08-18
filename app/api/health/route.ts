export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
  const voice = process.env.REALTIME_VOICE || "shimmer";
  const domains = process.env.ALLOWED_DOMAINS || "";
  return NextResponse.json({
    ok: true,
    env: {
      OPENAI_API_KEY: hasKey ? "present" : "missing",
      REALTIME_MODEL: model,
      REALTIME_VOICE: voice,
      ALLOWED_DOMAINS: domains
    }
  });
}
