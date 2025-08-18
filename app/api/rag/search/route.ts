export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { searchRag } from "@/lib/rag";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
  try {
    const hits = await searchRag(String(query), 4);
    const text = hits
      .map((h, i) => `[#${i + 1}] ${h.title}\n---\n${h.snippet}`)
      .join("\n\n");
    const sources = hits.map(h => ({ title: h.title, url: h.url })); // kept for internal/debug if needed
    return NextResponse.json({ text, sources });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}