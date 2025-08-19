# Pegadaian Voice RAG — v3.9.4h

- Halaman utama berisi: **Hubungkan & Bicara**, **Tanya**, **Bangun / Refresh Indeks**.
- Voice memakai Realtime API (WebRTC), suara `shimmer` (wanita), bahasa Indonesia natural.
- Jawaban **tidak menyebut sumber**, hanya isi jawaban.
- Panel Debug + tombol **Tes Audio** dan **Beep**.

## ENV minimal
OPENAI_API_KEY=sk-...
ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://sahabat.pegadaian.co.id
RAG_EXTRA_URLS=https://sahabat.pegadaian.co.id/produk-pegadaian/pinjaman-serbaguna
ONLY_EXTRA=true
EMBED_MODEL=text-embedding-3-small
EMBED_BATCH_SIZE=32
MAX_CRAWL_URLS=10
CHUNK_SIZE=900
CHUNK_OVERLAP=120
QA_MODEL=gpt-4o-mini
REALTIME_MODEL=gpt-4o-realtime-preview
REALTIME_VOICE=shimmer

## Langkah cepat
1) Upload ke GitHub → Vercel → Deploy (Node 20.x).  
2) Set ENV di atas (Production/Preview aktif), redeploy.  
3) Buka `/api/health` → cek `build: v3.9.4h` & `OPENAI_API_KEY: present`.  
4) Klik **Bangun / Refresh Indeks** → coba **Tanya** & **Hubungkan & Bicara**.


## v3.9.4i
- Tambah endpoint **/api/tts/say** (fallback REST TTS) dan tombol **Tes Audio (REST)** yang tidak butuh WebRTC.
- Tambah header `OpenAI-Beta: realtime=v1` di pembuatan session Realtime.
