import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    const model = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
    const voice = process.env.REALTIME_VOICE || "shimmer";
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return res.status(500).json({ ok:false, error:"OPENAI_API_KEY not set" });
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type":"application/json", "OpenAI-Beta":"realtime=v1" },
      body: JSON.stringify({ model, voice })
    });
    const text = await r.text();
    if(!r.ok) return res.status(r.status).json({ ok:false, status:r.status, error:text });
    let j:any={}; try{ j = JSON.parse(text); }catch{}
    if(!j?.client_secret?.value) return res.status(500).json({ ok:false, error:"No client_secret.value", raw:j });
    return res.status(200).json({ ...j, session_model: model });
  }catch(e:any){ return res.status(500).json({ ok:false, error: e?.message || String(e) }); }
}
