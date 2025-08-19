export const runtime = "nodejs"; export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"; import { buildIndex } from "@/lib/rag";
export async function POST(){ try { const info = await buildIndex(); return NextResponse.json({ ok:true, ...info }); } catch(e:any){ return NextResponse.json({ ok:false, error:e?.message || String(e) }, { status:500 }); } }
