# Asisten Suara Pegadaian — v3.9.1 (Canonical Context-Only)

- **Canonical URL routing** dari `RAG_EXTRA_URLS` → jawaban produk/biaya disusun hanya dari halaman produk terpilih.
- **Fallback** ke RAG jika tak ada padanan.
- **Suara**: shimmer (wanita), **Bahasa**: Indonesia natural.
- **Endpoint**: `/api/rag/answer`, `/api/rag/search`, `/api/rag/reindex`, `/api/realtime/session`, `/api/health`.

## ENV contoh
```
OPENAI_API_KEY=sk-...
ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://sahabat.pegadaian.co.id
RAG_EXTRA_URLS=<daftar URL produk dipisah koma>
QA_MODEL=gpt-4o-mini
REALTIME_MODEL=gpt-4o-realtime-preview
REALTIME_VOICE=shimmer
```

## Alur uji cepat
1) Set ENV & deploy ke Vercel.
2) Buka `/api/health` (cek `RAG_EXTRA_URLS_count`).
3) Di halaman utama klik **Bangun/Refresh Indeks**.
4) Coba:
   - `{"query":"apa itu pinjaman serbaguna"}` → harus merangkum dari halaman *pinjaman-serbaguna*.
   - `{"query":"biaya administrasi pinjaman serbaguna"}` → gunakan angka dari halaman tsb; jika tidak ada, jawab "belum tercantum".
