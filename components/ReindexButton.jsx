"use client";
import { useState } from "react";
export default function ReindexButton() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const run = async () => {
    try {
      setLoading(true); setStatus("Membangun indeks...");
      const res = await fetch("/api/rag/reindex", { method: "POST", cache: "no-store" });
      const j = await res.json();
      if (j.ok) setStatus(`Sukses. Dokumen: ${j.docs}, fee: ${j.fees}`);
      else setStatus(`Gagal: ${j.error || "unknown error"}`);
    } catch (e) { setStatus("Gagal: " + (e?.message || String(e))); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-2">
      <button onClick={run} disabled={loading} className="px-3 py-2 rounded-lg bg-amber-600 text-white">
        {loading ? "Memproses..." : "Bangun / Refresh Indeks"}
      </button>
      <div className="text-xs text-slate-600">{status}</div>
    </div>
  );
}
