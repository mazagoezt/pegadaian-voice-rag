# Pegadaian Voice RAG — Vercel (v3.8.3c, Pages Router only)

Paket ini **TANPA folder `app/`** sehingga tidak ada konflik "pages/index.tsx - app/page.tsx".
Semua API ada di **`pages/api/*`**. Halaman “/” pakai SSR (`getServerSideProps`) agar tidak di-SSG.

## ENV (Vercel → Settings → Environment Variables)
```
OPENAI_API_KEY=sk-...
ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://www.sahabat.pegadaian.co.id
RAG_EXTRA_URLS=<CSV link produk Pegadaian>  # pisahkan koma
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

## Tes cepat
1) Deploy → buka `/api/health` (harus `build: v3.8.3c-vercel-pages`).
2) Klik **Bangun / Refresh Indeks** → **Tanya**.
3) **Tes Audio (REST)** harus terdengar. **Hubungkan & Bicara** → bila hanya teks, auto-speak membacakan.
