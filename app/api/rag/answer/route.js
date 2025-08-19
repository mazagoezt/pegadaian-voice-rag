export const runtime = "nodejs"; export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"; import { searchRag, searchFees } from "@/lib/rag"; import { bestCanonicalUrl } from "@/lib/canonical"; import { scrapeWithFallback } from "@/lib/scrape";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36 KomoBot/1.1";
function isDef(q){ return /(apa itu|apa yang dimaksud|jelaskan|definisi)/i.test(q); } function isFee(q){ return /(biaya|tarif|sewa modal|bunga|margin|ujrah|administrasi|denda)/i.test(q); }
async function fetchText(u){ const html = await fetch(u, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" }).then(r => r.text()); return scrapeWithFallback(html); }
export async function POST(req){ const body = await req.json(); const query = String(body?.query || ""); if(!query) return NextResponse.json({ error:"query required"},{status:400});
  const extraCsv = process.env.RAG_EXTRA_URLS || ""; const canon = bestCanonicalUrl(query, extraCsv);
  try{
    if(canon){ const { title, content } = await fetchText(canon); const contextText = `${title}\n---\n${content}`.slice(0,15000);
      const system = isDef(query) ? "Jelaskan produk yang ditanyakan (definisi, manfaat utama, siapa yang cocok). Jawab HANYA dari konteks di bawah. Jangan sebutkan sumber/URL." :
        (isFee(query) ? "Sebutkan angka biaya/tarif dari konteks bila ada, ringkas dan jelas. Bila tidak ditemukan di konteks, katakan belum tercantum. Jangan sebutkan sumber/URL." :
        "Jawab ringkas dan relevan HANYA dari konteks. Jangan sebutkan sumber/URL. Jika informasi spesifik tidak ada di konteks, katakan belum tercantum.");
      const model = process.env.QA_MODEL || "gpt-4o-mini";
      const r = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{ "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" },
        body: JSON.stringify({ model, temperature:0.1, messages:[ { role:"system", content: system }, { role:"user", content:`Pertanyaan: ${query}` }, { role:"user", content:`KONTEKS (wajib):\n${contextText}` } ] }) });
      if(!r.ok){ const err = await r.text(); return NextResponse.json({ answer:"Maaf, terjadi kendala memproses jawaban.", error: err }, { status:500 }); }
      const j = await r.json(); const answer = j?.choices?.[0]?.message?.content || "Maaf, belum ada informasi dalam konteks."; return NextResponse.json({ answer, source:"canonical", page: canon });
    }
    const hits = await searchRag(query,6); const fees = searchFees(query);
    if(isFee(query) && fees.length){ const formatted = `Berikut rincian yang relevan:\n${fees.map(f=>`• ${f.label}: ${f.value}${f.unit ? " " + f.unit : ""}`).join("\n")}\nCatatan: angka dapat berubah.`; return NextResponse.json({ answer: formatted, source:"fees+rag" }); }
    const contextText = hits.map((h,i)=>`[#${i+1}] ${h.title}\n---\n${h.snippet}`).join("\n\n"); const model = process.env.QA_MODEL || "gpt-4o-mini";
    const sys = isDef(query) ? "Jelaskan definisi produk berdasarkan konteks berikut. Jangan sebutkan sumber/URL." : "Jawab ringkas dan relevan hanya dari konteks berikut. Jangan sebutkan sumber/URL.";
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{ "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({ model, temperature:0.2, messages:[ { role:"system", content: sys }, { role:"user", content:`Pertanyaan: ${query}\n\nKonteks:\n${contextText}` } ] }) });
    if(!r.ok){ const err = await r.text(); return NextResponse.json({ answer:"Maaf, terjadi kendala memproses jawaban.", error: err }, { status:500 }); }
    const j = await r.json(); const answer = j?.choices?.[0]?.message?.content || "Maaf, belum ada informasi dalam indeks."; return NextResponse.json({ answer, source:"rag" });
  } catch(e){ return NextResponse.json({ answer:"Maaf, terjadi kendala.", error:e?.message || String(e) }, { status:500 }); }
}
