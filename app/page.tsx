import Link from "next/link";
import dynamic from "next/dynamic";
import ReindexButton from "@/components/ReindexButton";
import QuickAsk from "@/components/QuickAsk";

const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asisten Suara Portofolio Pegadaian</h1>
      <p className="text-slate-700">Build v3.9.4a — ada tombol <em>Hubungkan & Bicara</em>, <em>Tanya</em>, dan <em>Bangun / Refresh Indeks</em>.</p>
      <div className="p-4 rounded-2xl border bg-white"><VoiceAgent /></div>
      <div className="p-4 rounded-2xl border bg-white"><QuickAsk /></div>
      <div className="p-4 rounded-2xl border bg-white"><ReindexButton /></div>
      <ul className="list-disc pl-6 text-slate-700">
        <li><Link href="/api/health" className="underline">/api/health</Link></li>
        <li><Link href="/api/debug/embed" className="underline">/api/debug/embed</Link></li>
      </ul>
    </main>
  );
}
