# Pegadaian Voice RAG — v3.9.4 (Lengkap: Voice + Reindex + Debug)

Endpoint penting:
- `GET /api/health` — cek ENV.
- `GET /api/debug/embed` — tes embeddings kecil.
- `POST /api/rag/reindex` — bangun indeks.
- `POST /api/rag/answer` — jawaban terarah (canonical jika cocok).

## ENV minimal
```
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
```
