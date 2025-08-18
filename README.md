# Pegadaian Voice RAG — v3.9.2 (Fix Embedding Failed)

Perubahan penting:
- **Chunked embeddings** dengan retry (atur `EMBED_BATCH_SIZE`, default 64).
- Pesan kesalahan dari OpenAI **diteruskan** (bukan generik), jadi mudah diagnosa.
- **ONLY_EXTRA=true** → index **hanya** dari daftar `RAG_EXTRA_URLS` (lebih ringan & presisi).
- Default **EMBED_MODEL=text-embedding-3-small**, **MAX_CRAWL_URLS=30**, **CHUNK_SIZE=900**.

## ENV contoh
```
OPENAI_API_KEY=sk-...
ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://sahabat.pegadaian.co.id
RAG_EXTRA_URLS=<daftar URL>
ONLY_EXTRA=true
EMBED_MODEL=text-embedding-3-small
EMBED_BATCH_SIZE=48
MAX_CRAWL_URLS=24
CHUNK_SIZE=900
CHUNK_OVERLAP=120
```

## Uji cepat
1) Set ENV seperti di atas, **redeploy**.
2) GET `/api/health` → pastikan `OPENAI_API_KEY:"present"` dan jumlah `RAG_EXTRA_URLS` sesuai.
3) POST `/api/rag/reindex` → jika gagal, respons akan menampilkan detail HTTP dari endpoint embeddings.
