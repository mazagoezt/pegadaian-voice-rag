export const runtime = "nodejs"; export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest){
  const key = process.env.OPENAI_API_KEY; if (!key) return NextResponse.json({ ok:false, error:"OPENAI_API_KEY missing" }, { status: 500 });
  const { searchParams } = new URL(req.url); const text = searchParams.get("text") || "Tes audio berhasil.";
  const voice = process.env.REALTIME_VOICE || "shimmer"; const model = process.env.TTS_MODEL || "tts-1";
  try { const r = await fetch("https://api.openai.com/v1/audio/speech", { method:"POST", headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, voice, input: text, format:"mp3" }) });
    if (!r.ok) { const err = await r.text(); return NextResponse.json({ ok:false, status:r.status, error: err.slice(0,800) }, { status:r.status }); }
    const buf = Buffer.from(await r.arrayBuffer()); return new NextResponse(buf, { status:200, headers: { "Content-Type": "audio/mpeg" } });
  } catch(e:any){ return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status: 500 }); }
}
