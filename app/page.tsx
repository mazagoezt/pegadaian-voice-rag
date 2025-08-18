import VoiceAgent from "@/components/VoiceAgent";
import ReindexButton from "@/components/ReindexButton";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asisten Suara Portofolio Pegadaian</h1>
      <p className="text-slate-600">Berbahasa Indonesia natural, suara wanita. Jawaban diambil dari situs resmi Pegadaian.</p>
      <div className="p-4 rounded-2xl border bg-white">
        <VoiceAgent />
      </div>
      <div className="p-4 rounded-2xl border bg-white">
        <ReindexButton />
      </div>
      <div className="text-xs text-slate-500">
        <p><strong>Privasi:</strong> Hanya membaca konten publik dari domain yang diizinkan. Hormati robots.txt & ketentuan situs.</p>
      </div>
    </main>
  );
}
