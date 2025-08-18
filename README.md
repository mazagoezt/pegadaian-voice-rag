# Pegadaian Voice RAG — v3.9.3 (Embedding Debug Included)

Endpoint penting:
- `GET /api/health` — cek ENV yang terbaca.
- `GET /api/debug/embed` — tes embeddings kecil (`["ping"]`), menampilkan status & cuplikan respons.
- `POST /api/rag/reindex` — bangun indeks.

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
```
