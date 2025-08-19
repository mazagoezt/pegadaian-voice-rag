import Link from "next/link";
import ReindexButton from "@/components/ReindexButton";
import dynamic from "next/dynamic";

const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asisten Suara Portofolio Pegadaian</h1>
      <p>Build v3.9.4 — lengkap: tombol Reindex, Voice (Realtime), dan endpoint debug.</p>
      <div className="p-4 rounded-2xl border bg-white"><VoiceAgent /></div>
      <div className="p-4 rounded-2xl border bg-white"><ReindexButton /></div>
      <ul className="list-disc pl-6 text-slate-700">
        <li><Link href="/api/health" className="underline">/api/health</Link></li>
        <li><Link href="/api/debug/embed" className="underline">/api/debug/embed</Link></li>
      </ul>
    </main>
  );
}
