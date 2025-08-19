import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    const key = process.env.OPENAI_API_KEY; if(!key) return res.status(500).json({ ok:false, error:"OPENAI_API_KEY missing" });
    const text = String(req.query.text || "Tes audio berhasil.");
    const voice = process.env.REALTIME_VOICE || "shimmer"; const model = process.env.TTS_MODEL || "tts-1";
    const r = await fetch("https://api.openai.com/v1/audio/speech", { method:"POST", headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, voice, input: text, format:"mp3" }) });
    const buf = Buffer.from(await r.arrayBuffer());
    if(!r.ok){ const body = buf.toString("utf8"); return res.status(r.status).json({ ok:false, status:r.status, error: body.slice(0,800) }); }
    res.setHeader("Content-Type","audio/mpeg"); return res.status(200).send(buf);
  }catch(e:any){ return res.status(500).json({ ok:false, error: e?.message || String(e) }); }
}
