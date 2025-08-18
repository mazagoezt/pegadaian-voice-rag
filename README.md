# Asisten Suara Pegadaian — v3.8.2-r3 (Better fee matching + Realtime)

- Bahasa: Indonesia natural, suara wanita (**shimmer**)
- Tidak menyebut sumber/URL (kecuali diminta)
- Ekstraksi otomatis angka biaya/tarif (biaya admin, sewa modal/bunga/margin/ujrah, dll)
- Endpoint QA: `POST /api/rag/answer`

## ENV (Vercel)
```
OPENAI_API_KEY=sk-...
ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://www.sahabat.pegadaian.co.id
EMBED_MODEL=text-embedding-3-large
REALTIME_MODEL=gpt-4o-realtime-preview
REALTIME_VOICE=shimmer
MAX_CRAWL_URLS=40
CHUNK_SIZE=1200
CHUNK_OVERLAP=150
RAG_EXTRA_URLS=https://sahabat.pegadaian.co.id/produk-pegadaian/pinjaman-serbaguna
QA_MODEL=gpt-4o-mini
```

## Deploy
1) Upload isi folder ini ke GitHub (jangan commit `.env`)  
2) Vercel → Import Project → isi ENV → Deploy  
3) Buka `/api/health` → klik **Bangun/Refresh Indeks** → **Hubungkan & Bicara**
