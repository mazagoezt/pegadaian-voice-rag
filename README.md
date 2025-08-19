# Pegadaian Voice RAG — v3.9.4b (Voice + Tanya + Reindex + Debug)

Halaman utama menampilkan:
1) **Voice: Hubungkan & Bicara**
2) **Tanya** (input teks ke `/api/rag/answer`)
3) **Bangun / Refresh Indeks** (POST `/api/rag/reindex`)
+ link **/api/health** dan **/api/debug/embed**.

Cek versi build pada `/api/health` atau `/api/debug/embed` (menunjukkan `build: v3.9.4b`).

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


## v3.9.4c
- VoiceAgent: paksa model SELALU memanggil tool `search_company` (tool_choice) dan menangani event `response.required_action -> submit_tool_outputs`.
