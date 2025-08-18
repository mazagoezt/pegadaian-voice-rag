# Patch v3.9.2p — Debug Embeddings

Tambahan endpoint:
- `GET /api/debug/embed` → mengetes panggilan embeddings kecil (`["ping"]`) dan **mengembalikan HTTP status + potongan body**.
Gunakan ini untuk mendiagnosa "Embedding failed" (cek 401/429/400).

## Cara pakai
1) Commit file ini ke repo (folder `app/api/debug/embed/route.ts`).
2) Deploy. Buka `/api/debug/embed` di browser.
3) Hasil yang diharapkan: `{ ok: true, status: 200, ... }`.
   - **401** → API key salah/tidak punya izin.
   - **429** → rate limit atau **insufficient_quota** (isi saldo/naikkan kuota).
   - **400** → cek `model` salah/tidak tersedia, atau ada kolom request tidak valid.
