# Asisten Suara Pegadaian — v3.8.1 (Smarter Answers)

- Bahasa: Indonesia natural
- Suara: Wanita (voice: `shimmer` — Realtime API supported)
- Sumber data: HANYA dari `pegadaian.co.id` dan `sahabat.pegadaian.co.id`
- Jawaban: **langsung ke angka** bila tersedia (tarif/biaya), tanpa menyebut sumber/URL kecuali diminta
- Tambahan: **Ekstraksi otomatis** kata kunci biaya, endpoint **/api/rag/answer**

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
RAG_EXTRA_URLS=
QA_MODEL=gpt-4o-mini
```

## Deploy
1) Upload isi folder ini ke GitHub (jangan commit `.env`)  
2) Vercel → Import Project → isi ENV → Deploy  
3) Buka `/api/health` (cek `OPENAI_API_KEY`) → klik **Bangun/Refresh Indeks** → **Hubungkan & Bicara**

## Catatan
- Tambahkan URL penting ke `RAG_EXTRA_URLS` agar pasti terindeks.  
- Angka dapat berubah kebijakan; bot akan menyebut catatan tersebut.
