# Asisten Suara Pegadaian (Realtime + RAG, tanpa sebut sumber)

- Bahasa: Indonesia natural
- Suara: Wanita (voice: `nova`)
- Sumber data: HANYA dari `pegadaian.co.id` dan `sahabat.pegadaian.co.id`
- Presentasi jawaban: **tanpa menyebutkan sumber/URL**, kecuali diminta pengguna

## Cara Jalankan Lokal
1. Salin `.env.example` ke `.env` dan isi `OPENAI_API_KEY` Anda.
2. `npm install`
3. Jalankan dev server: `npm run dev`
4. Buka `http://localhost:3000` → klik **Bangun / Refresh Indeks** → **Hubungkan & Bicara**

## Deploy Gratis (Vercel)
1. Buat repo GitHub dari source ini.
2. Di Vercel: **New Project** → import repo.
3. Tambahkan Environment Variables:
   - `OPENAI_API_KEY`
   - `ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://www.sahabat.pegadaian.co.id`
   - `EMBED_MODEL=text-embedding-3-large`
   - `REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17`
   - `REALTIME_VOICE=nova`
   - `MAX_CRAWL_URLS=80`
   - `CHUNK_SIZE=1200`
   - `CHUNK_OVERLAP=150`
4. Deploy → dapat domain `*.vercel.app`.
5. Setelah deploy, di halaman utama klik **Bangun / Refresh Indeks**.

## Catatan
- Jangan expose `OPENAI_API_KEY` di client.
- Hormati robots.txt & syarat layanan situs.
- Untuk skala produksi: gunakan vector DB, scheduler reindex, dan caching.