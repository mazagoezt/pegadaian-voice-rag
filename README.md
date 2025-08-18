# Asisten Suara Pegadaian (Realtime + RAG, tanpa sebut sumber)

- Bahasa: Indonesia natural
- Suara: Wanita (voice: `shimmer` — Realtime API supported)
- Sumber data: HANYA dari `pegadaian.co.id` dan `sahabat.pegadaian.co.id`
- Presentasi jawaban: **tanpa menyebutkan sumber/URL**, kecuali diminta pengguna

## Cara Jalankan Lokal
1. Salin `.env.example` ke `.env` dan isi `OPENAI_API_KEY` Anda.
2. `npm install`
3. `npm run dev`
4. Buka `http://localhost:3000` → klik **Bangun / Refresh Indeks** → **Hubungkan & Bicara**

## Deploy Gratis (Vercel)
1. Upload isi folder ini ke GitHub (jangan commit `.env`).
2. Vercel: **New Project** → Import repo.
3. Tambahkan Environment Variables:
   - `OPENAI_API_KEY`
   - `ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://www.sahabat.pegadaian.co.id`
   - `EMBED_MODEL=text-embedding-3-large`
   - `REALTIME_MODEL=gpt-4o-realtime-preview`
   - `REALTIME_VOICE=shimmer`
   - `MAX_CRAWL_URLS=40`
   - `CHUNK_SIZE=1200`
   - `CHUNK_OVERLAP=150`
4. **Deploy**. Setelah live, buka situs → klik **Bangun / Refresh Indeks**.

## Health Check
- Buka `/api/health` untuk memastikan ENV terbaca di server.
- Buka `/api/realtime/session` untuk melihat JSON token ephemeral.
