export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const model = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
  const voice = process.env.REALTIME_VOICE || "shimmer";
  const apiKey = process.env.OPENAI_API_KEY;
  const org = process.env.OPENAI_ORG_ID; // optional

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY not set on server." }, { status: 500 });
  }

  const headers: Record<string,string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (org) headers["OpenAI-Organization"] = org;

  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers,
      body: JSON.stringify({ model, voice })
    });

    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json({ ok: false, status: r.status, error: text }, { status: 500 });
    }

    const j = JSON.parse(text);
    if (!j?.client_secret?.value) {
      return NextResponse.json({ ok: false, error: "No client_secret.value in response", raw: j }, { status: 500 });
    }
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
