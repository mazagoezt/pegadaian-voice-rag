
import dynamic from "next/dynamic";
import Link from "next/link";
const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), { ssr: false });
export const getServerSideProps = async () => ({ props: {} });
export default function Home(){
  return (<main className="max-w-2xl mx-auto p-6 space-y-6">
    <h1 className="text-2xl font-bold">Pegadaian Voice RAG — Vercel (v3.8.3b)</h1>
    <p className="text-slate-700">Jalur 2: Realtime WebRTC + RAG. Bahasa Indonesia, suara wanita.</p>
    <section className="p-4 rounded-2xl border bg-white"><h2 className="font-semibold mb-2">1) Voice: Hubungkan &amp; Bicara</h2><VoiceAgent /><div className="mt-2 text-xs text-slate-500">Jika suara tak keluar, coba <b>Tes Audio (REST)</b> atau lihat <b>Debug</b>.</div></section>
    <section className="p-4 rounded-2xl border bg-white"><h2 className="font-semibold mb-2">2) Tanya (teks)</h2>
      <form onSubmit={async (e)=>{e.preventDefault(); const f=new FormData(e.currentTarget as HTMLFormElement); const q=String(f.get("q")||""); const res=await fetch("/api/rag/answer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:q})}); const j=await res.json(); (document.getElementById("ans") as any).textContent=j?.answer||j?.text||"Tidak ada jawaban.";}} className="space-y-2">
        <div className="flex gap-2"><input name="q" placeholder="Tulis pertanyaan..." className="flex-1 px-3 py-2 rounded-xl border" /><button className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Tanya</button></div>
      </form>
      <div id="ans" className="text-sm whitespace-pre-wrap border rounded-xl p-3 bg-white mt-2"></div>
    </section>
    <section className="p-4 rounded-2xl border bg-white"><h2 className="font-semibold mb-2">3) Bangun / Refresh Indeks</h2>
      <form onSubmit={async (e)=>{e.preventDefault(); const res=await fetch("/api/rag/reindex",{method:"POST"}); const j=await res.json(); (document.getElementById("idx") as any).textContent=j.ok?("Sukses: dokumen="+j.docs):("Gagal: "+j.error);}}>
        <button className="px-3 py-2 rounded-lg bg-amber-600 text-white">Bangun / Refresh Indeks</button>
      </form>
      <div id="idx" className="text-xs text-slate-600 mt-2"></div>
    </section>
    <ul className="list-disc pl-6 text-slate-700"><li><Link href="/api/health" className="underline">/api/health</Link></li><li><Link href="/api/debug/embed" className="underline">/api/debug/embed</Link></li></ul>
  </main>);
}
