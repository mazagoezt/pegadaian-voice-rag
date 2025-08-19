# Pegadaian Voice RAG — v3.9.6

Fitur:
- **Voice Realtime (WebRTC)**: Indonesia natural, suara `shimmer`. Otomatis **membacakan** jawaban teks jika model tidak mengirim audio.
- **RAG**: Reindex dari situs resmi (ALLOWED_DOMAINS + RAG_EXTRA_URLS). Ekstraksi biaya/sewa modal dari tabel & paragraf.
- **Tes Audio (REST)**, **Debug** panel, **/api/health** dan **/api/debug/embed**.

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
REALTIME_MODEL=gpt-4o-realtime-preview-2025-06-03
REALTIME_VOICE=shimmer
TTS_MODEL=tts-1

## Deploy
- **Vercel**: Import repo → Node 20 → set ENV → Deploy.
- **Render**: gunakan `render.yaml` (sudah termasuk).
- **Netlify**: gunakan `netlify.toml` (sudah termasuk).

## Uji cepat
- `/api/health` → cek `build: v3.9.6` dan API key `present`.
- Klik **Bangun / Refresh Indeks** → **Tanya**.
- Voice: **Tes Audio (REST)** bunyi → **Hubungkan & Bicara**. Bila Debug hanya teks (tanpa audio), auto-speak akan membacakan.
