# Pegadaian Voice RAG — v3.9.5b

Fitur utama:
- **Hubungkan & Bicara (Realtime WebRTC)** — suara `shimmer` (wanita), Indonesia natural, paksa tool-call ke RAG.
- **Tanya (teks)** — POST ke `/api/rag/answer` (tanpa sebut sumber).
- **Bangun / Refresh Indeks** — POST ke `/api/rag/reindex`.
- Panel **Debug**, tombol **Tes Audio**, **Tes Audio (REST)**, dan **Beep**.

## ENV minimal
OPENAI_API_KEY=sk-...
ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://www.sahabat.pegadaian.co.id
RAG_EXTRA_URLS=https://www.sahabat.pegadaian.co.id/produk-pegadaian/pinjaman-serbaguna
ONLY_EXTRA=true
EMBED_MODEL=text-embedding-3-small
EMBED_BATCH_SIZE=32
MAX_CRAWL_URLS=10
CHUNK_SIZE=900
CHUNK_OVERLAP=120
QA_MODEL=gpt-4o-mini
REALTIME_MODEL=gpt-4o-realtime-preview
REALTIME_VOICE=shimmer
TTS_MODEL=gpt-4o-mini-tts

## Deploy cepat (Vercel)
1) Upload repo ke GitHub → Vercel → Import → Deploy. (Project Settings → General → **Node.js Version = 20.x**)
2) Set ENV di atas pada **Production** & **Preview**, lalu Redeploy.
3) Buka `/api/health` → pastikan `build: v3.9.5` dan `OPENAI_API_KEY: present`.

## Troubleshooting
- **Tombol tidak merespon** → pastikan `VoiceAgent.tsx` punya `"use client"` dan `app/page.tsx` import dengan `dynamic(..., { ssr:false })` (sudah di repo).
- **Tidak ada suara** → coba `Tes Audio (REST)`; jika bunyi, masalahnya khusus WebRTC (coba hotspot). Panel Debug akan log `pc.state=...` dan `Remote track received`.
- **Index kosong** → klik **Bangun / Refresh Indeks** setelah `RAG_EXTRA_URLS` diisi.


## v3.9.5a
- Perbaikan **Tes Audio (REST)**: gunakan endpoint `/v1/audio/speech` (model default `tts-1`), dan client memutar lewat Blob URL agar kompatibel lintas browser.
