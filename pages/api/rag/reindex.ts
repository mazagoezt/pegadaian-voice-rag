import type { NextApiRequest, NextApiResponse } from "next";
import { buildIndex } from "@/lib/rag";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });
  try{ const info = await buildIndex(); return res.status(200).json({ ok:true, ...info }); }
  catch(e:any){ return res.status(500).json({ ok:false, error: e?.message || String(e) }); }
}
