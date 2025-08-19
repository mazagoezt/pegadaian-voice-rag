import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    const key = process.env.OPENAI_API_KEY; const model = process.env.EMBED_MODEL || "text-embedding-3-small";
    if(!key) return res.status(500).json({ ok:false, error:"OPENAI_API_KEY missing" });
    const r = await fetch("https://api.openai.com/v1/embeddings",{ method:"POST", headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, input:["ping"] }) });
    const txt = await r.text(); return res.status(200).json({ ok:r.ok, status:r.status, body: txt.slice(0,600), model, build: "v3.8.3c-vercel-pages" });
  }catch(e:any){ return res.status(500).json({ ok:false, error: e?.message || String(e) }); }
}
