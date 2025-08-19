
export const runtime="nodejs"; export const dynamic="force-dynamic";
import { NextResponse } from "next/server";
export async function GET(){ const env={OPENAI_API_KEY:process.env.OPENAI_API_KEY?"present":"missing",REALTIME_MODEL:process.env.REALTIME_MODEL||"gpt-4o-realtime-preview",REALTIME_VOICE:process.env.REALTIME_VOICE||"shimmer",QA_MODEL:process.env.QA_MODEL||"gpt-4o-mini",TTS_MODEL:process.env.TTS_MODEL||"tts-1",EMBED_MODEL:process.env.EMBED_MODEL||"text-embedding-3-small"}; return NextResponse.json({ok:true,env,build:"v3.8.3b-vercel"}); }
