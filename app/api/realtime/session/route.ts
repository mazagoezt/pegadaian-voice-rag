import { NextResponse } from "next/server";

export async function GET() {
  const model = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";
  const voice = process.env.REALTIME_VOICE || "nova";
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, voice })
  });
  if (!r.ok) {
    const e = await r.text();
    return NextResponse.json({ error: e }, { status: 500 });
  }
  const j = await r.json();
  return NextResponse.json(j);
}