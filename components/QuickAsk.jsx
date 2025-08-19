"use client";
import { useState } from "react";
export default function QuickAsk() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [loading, setLoading] = useState(false);
  async function ask() {
    if (!q.trim()) return;
    setLoading(true); setA("");
    try {
      const res = await fetch("/api/rag/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
      const j = await res.json();
      setA(j?.answer || j?.text || "Tidak ada jawaban.");
    } catch (e) { setA("Gagal memproses: " + (e?.message || String(e))); }
    finally { setLoading(false); }
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tulis pertanyaan di sini..." className="flex-1 px-3 py-2 rounded-xl border" />
        <button onClick={ask} disabled={loading} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">{loading ? "Memproses..." : "Tanya"}</button>
      </div>
      {a && <div className="text-sm whitespace-pre-wrap border rounded-xl p-3 bg-white">{a}</div>}
    </div>
  );
}
