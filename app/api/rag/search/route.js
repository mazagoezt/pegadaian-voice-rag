export const runtime = "nodejs"; export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"; import { searchRag } from "@/lib/rag";
export async function POST(req){ const { query } = await req.json(); if(!query) return NextResponse.json({ error:"query required"},{status:400});
  try{ const hits = await searchRag(String(query),6); const text = hits.map((h,i)=>`[#${i+1}] ${h.title}\n---\n${h.snippet}`).join("\n\n"); const sources = hits.map(h=>({title:h.title,url:h.url})); return NextResponse.json({ text, sources }); } 
  catch(e){ return NextResponse.json({ error:e?.message || String(e) }, { status:500 }); } }
