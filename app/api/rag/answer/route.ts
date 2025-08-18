export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { searchRag, searchFees } from "@/lib/rag";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    const hits = await searchRag(String(query), 6);
    const fees = searchFees(String(query), hits);
    if (fees.length) {
      const formatted = `Berikut rincian yang relevan:\n${fees.map(f => `• ${f.label}: ${f.value}${f.unit ? " " + f.unit : ""}`).join("\n")}\nCatatan: angka dapat berubah sewaktu-waktu.`;
      return NextResponse.json({ answer: formatted, raw: { fees, hits: hits.map(h => h.title) } });
    }

    const model = process.env.QA_MODEL || "gpt-4o-mini";
    const contextText = hits.map((h, i) => `[#${i + 1}] ${h.title}\n---\n${h.snippet}`).join("\n\n");
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Jawab dalam bahasa Indonesia, ringkas, sopan, dan langsung ke poin. Jangan menyebutkan sumber atau URL. Jika ada angka tarif/biaya di konteks, sebutkan angkanya eksplisit. Jika tidak ada di konteks, jawab dengan jujur bahwa angka rinci tidak ditemukan di indeks saat ini." },
          { role: "user", content: `Pertanyaan: ${query}\n\nKonteks:\n${contextText}` }
        ]
      })
    });
    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ answer: "Maaf, terjadi kendala memproses jawaban.", error: err }, { status: 500 });
    }
    const j = await r.json();
    const answer = j?.choices?.[0]?.message?.content || "Maaf, belum ada informasi dalam indeks.";
    return NextResponse.json({ answer, raw: { hits: hits.map(h => h.title) } });
  } catch (e: any) {
    return NextResponse.json({ answer: "Maaf, terjadi kendala.", error: e?.message || String(e) }, { status: 500 });
  }
}
