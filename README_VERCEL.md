# Deploy ke Vercel — Pegadaian Voice RAG (v3.9.6v)

Paket ini memakai **Pages Router** untuk halaman "/" agar menghindari error
`Static page generation for / is still timing out`. API tetap di **App Router**.

## Langkah
1. Upload project ke repo GitHub (push ZIP ini).
2. Vercel → New Project → Import repo.
3. **Node.js = 20.x** (Project Settings → Node.js).
4. Tambahkan ENV berikut (Production & Preview):
   ```
   OPENAI_API_KEY=sk-...
   ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://www.sahabat.pegadaian.co.id
   RAG_EXTRA_URLS=<CSV link produk Pegadaian>
   ONLY_EXTRA=true
   EMBED_MODEL=text-embedding-3-small
   EMBED_BATCH_SIZE=32
   MAX_CRAWL_URLS=10
   CHUNK_SIZE=900
   CHUNK_OVERLAP=120
   QA_MODEL=gpt-4o-mini
   REALTIME_MODEL=gpt-4o-realtime-preview-2025-06-03
   REALTIME_VOICE=shimmer
   TTS_MODEL=tts-1
   ```
5. Deploy → cek `/api/health` (build `v3.9.6v`).

Jika masih muncul error build, pastikan **Auto Instrumentation** tidak memodifikasi SSR kamu,
dan tidak ada plugin/setting yang mengubah output menjadi static export.
