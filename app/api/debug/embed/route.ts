
export const runtime="nodejs"; export const dynamic="force-dynamic";
import { NextResponse } from "next/server";
export async function GET(){ const key=process.env.OPENAI_API_KEY; const model=process.env.EMBED_MODEL||"text-embedding-3-small"; if(!key) return NextResponse.json({ok:false,error:"OPENAI_API_KEY missing"},{status:500}); try{ const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Authorization":`Bearer ${key}","Content-Type":"application/json"},body:JSON.stringify({model,input:["ping"]})}); const txt=await r.text(); return NextResponse.json({ok:r.ok,status:r.status,body:txt.slice(0,600),model,build:"v3.8.3b-vercel"}); }catch(e:any){ return NextResponse.json({ok:false,error:e?.message||String(e)},{status:500}); } }
