import ReindexButton from "@/components/ReindexButton";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Asisten Suara Portofolio Pegadaian</h1>
      <p className="text-slate-600">Klik tombol di bawah untuk bangun/refresh indeks RAG.</p>
      <div className="p-4 rounded-2xl border bg-white">
        <ReindexButton />
      </div>
      <div className="text-xs text-slate-500">
        <p><strong>Catatan:</strong> build v3.9.2 menambahkan batching embedding, error detail, dan opsi ONLY_EXTRA.</p>
      </div>
    </main>
  );
}
