import Link from "next/link";
import dynamic from "next/dynamic";
import ReindexButton from "@/components/ReindexButton";
import QuickAsk from "@/components/QuickAsk";

const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asisten Suara Portofolio Pegadaian — v3.9.4b</h1>
      <p className="text-slate-700">Tiga menu di bawah ini akan muncul bila deploy sukses.</p>
      <section className="p-4 rounded-2xl border bg-white">
        <h2 className="font-semibold mb-2">1) Voice: Hubungkan &amp; Bicara</h2>
        <p className="text-xs mb-2">Realtime voice (wanita: shimmer, Bahasa Indonesia natural).</p>
        <VoiceAgent />
      </section>
      <section className="p-4 rounded-2xl border bg-white">
        <h2 className="font-semibold mb-2">2) Tanya (teks)</h2>
        <p className="text-xs mb-2">Kirim ke <code>/api/rag/answer</code>.</p>
        <QuickAsk />
      </section>
      <section className="p-4 rounded-2xl border bg-white">
        <h2 className="font-semibold mb-2">3) Bangun / Refresh Indeks</h2>
        <p className="text-xs mb-2">POST ke <code>/api/rag/reindex</code>. Bangun index RAG dari URL di ENV.</p>
        <ReindexButton />
      </section>
      <ul className="list-disc pl-6 text-slate-700">
        <li><Link href="/api/health" className="underline">/api/health</Link></li>
        <li><Link href="/api/debug/embed" className="underline">/api/debug/embed</Link></li>
      </ul>
    </main>
  );
}
