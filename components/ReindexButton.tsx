"use client";
import { useState } from "react";

export default function ReindexButton() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    try {
      setLoading(true);
      setStatus("Membangun indeks...");
      const res = await fetch("/api/rag/reindex", { method: "POST", cache: "no-store" });
      const j = await res.json();
      if (j.ok) setStatus(`Sukses. Dokumen terindeks: ${j.docs}`);
      else setStatus(`Gagal: ${j.error || "unknown error"}`);
    } catch (e: any) {
      setStatus("Gagal: " + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={loading} className="px-3 py-2 rounded-lg bg-amber-600 text-white">
        {loading ? "Memproses..." : "Bangun / Refresh Indeks"}
      </button>
      <span className="text-xs text-slate-600">{status}</span>
    </div>
  );
}
