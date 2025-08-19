export const runtime = "nodejs"; export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok:false, error:"OPENAI_API_KEY missing" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "Tes audio berhasil.";
  const voice = process.env.REALTIME_VOICE || "shimmer";
  const model = process.env.TTS_MODEL || process.env.QA_MODEL || "gpt-4o-mini-tts";

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        modalities: ["text","audio"],
        audio: { voice, format: "mp3" },
        messages: [{ role: "user", content: text }],
        temperature: 0.2
      })
    });
    const txt = await r.text();
    if (!r.ok) return NextResponse.json({ ok:false, status:r.status, error: txt.slice(0,800) }, { status:r.status });
    const j = JSON.parse(txt);
    const a = j?.choices?.[0]?.message?.audio?.data;
    if (!a) return NextResponse.json({ ok:false, error:"No audio data in response", raw: j }, { status:500 });
    const buf = Buffer.from(a, "base64");
    return new NextResponse(buf, { status: 200, headers: { "Content-Type": "audio/mpeg" } });
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status: 500 });
  }
}
