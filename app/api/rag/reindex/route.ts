export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { buildIndex } from "@/lib/rag";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const info = await buildIndex();
    return NextResponse.json({ ok: true, ...info });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}