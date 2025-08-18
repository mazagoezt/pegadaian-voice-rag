import Link from "next/link";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Asisten Suara Portofolio Pegadaian</h1>
      <p>Build v3.9.3 — Fokus perbaikan embedding & debug.</p>
      <ul className="list-disc pl-6 text-slate-700">
        <li><Link href="/api/health" className="underline">/api/health</Link></li>
        <li><Link href="/api/debug/embed" className="underline">/api/debug/embed</Link> (tes OpenAI Embeddings)</li>
        <li><Link href="/api/rag/reindex" className="underline">/api/rag/reindex</Link> (POST)</li>
      </ul>
      <p className="text-xs text-slate-500">Set ENV lalu uji endpoint di atas.</p>
    </main>
  );
}
