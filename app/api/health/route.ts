export const dynamic = "force-dynamic"; export const runtime = "nodejs";
import { NextResponse } from "next/server";
export async function GET(){
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    REALTIME_MODEL: process.env.REALTIME_MODEL || "gpt-4o-realtime-preview",
    REALTIME_VOICE: process.env.REALTIME_VOICE || "shimmer",
    QA_MODEL: process.env.QA_MODEL || "gpt-4o-mini",
    TTS_MODEL: process.env.TTS_MODEL || "",
    EMBED_MODEL: process.env.EMBED_MODEL || "text-embedding-3-small",
    EMBED_BATCH_SIZE: process.env.EMBED_BATCH_SIZE || "32",
    ONLY_EXTRA: process.env.ONLY_EXTRA || "true",
    MAX_CRAWL_URLS: process.env.MAX_CRAWL_URLS || "10",
    CHUNK_SIZE: process.env.CHUNK_SIZE || "900",
    CHUNK_OVERLAP: process.env.CHUNK_OVERLAP || "120",
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS || "",
    RAG_EXTRA_URLS: (process.env.RAG_EXTRA_URLS || "").split(/\s*,\s*/).filter(Boolean).length
  }; return NextResponse.json({ ok:true, env, build: "v3.9.5b" });
}
