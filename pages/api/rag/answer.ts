import type { NextApiRequest, NextApiResponse } from "next";
import { searchRag } from "@/lib/rag";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  try{
    const query = String((req.body?.query ?? req.query?.q) || "");
    if (!query) return res.status(400).json({ error:"query required" });
    const model = process.env.QA_MODEL || "gpt-4o-mini";
    const hits = await searchRag(query, 6);
    const contextText = hits.map((h,i)=>`[#${i+1}] ${h.title}\n---\n${h.snippet}`).join("\n\n").slice(0, 12000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model, temperature: 0.2,
        messages: [
          { role: "system", content: "Kamu asisten Pegadaian. Bahasa Indonesia natural. Jawab ringkas hanya dari konteks berikut. Jangan sebutkan URL/sumber." },
          { role: "user", content: `Pertanyaan: ${query}\n\nKonteks:\n${contextText}` }
        ]
      })
    });
    const txt = await r.text();
    if(!r.ok){ return res.status(500).json({ answer:"Maaf, kendala memproses jawaban.", error: txt.slice(0,800) }); }
    const j = JSON.parse(txt); const answer = j?.choices?.[0]?.message?.content || "Maaf, belum ada informasi.";
    return res.status(200).json({ answer, source:"rag" });
  }catch(e:any){ return res.status(500).json({ answer:"Maaf, terjadi kendala.", error: e?.message || String(e) }); }
}
