# Asisten Suara Pegadaian — v3.8.3

Perbaikan utama:
- **Lexical boosting (URL & judul)** → halaman dengan slug `pinjaman-serbaguna` otomatis diprioritaskan.
- **Fallback scraping** (meta description, headings, JSON-LD) → tetap dapat teks meski konten berbasis JS.
- **Dual-host** `sahabat.pegadaian.co.id` (www & non-www) dalam seed.
- **Mode definisi** untuk pertanyaan seperti “apa itu pinjaman serbaguna”.

Langkah uji:
1) Set ENV `ALLOWED_DOMAINS=https://www.pegadaian.co.id,https://sahabat.pegadaian.co.id`
2) Tambah `RAG_EXTRA_URLS=https://sahabat.pegadaian.co.id/produk-pegadaian/pinjaman-serbaguna`
3) Deploy → buka `/api/health` → klik **Bangun/Refresh Indeks**
4) Tes `/api/rag/answer` (POST) dengan body: `{"query":"apa itu pinjaman serbaguna"}`
