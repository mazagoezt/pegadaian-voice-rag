import * as cheerio from "cheerio";
export type Doc = { url: string; title: string; content: string; embedding?: number[] };
export type Hit = { url: string; title: string; snippet: string; score: number };
let INDEX: Doc[] = [];
const EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const BATCH = Math.max(1, Math.min(128, Number(process.env.EMBED_BATCH_SIZE || 32)));
const MAX_CRAWL = Math.max(1, Number(process.env.MAX_CRAWL_URLS || 10));
const CHUNK_SIZE = Math.max(400, Number(process.env.CHUNK_SIZE || 900));
const CHUNK_OVERLAP = Math.max(60, Number(process.env.CHUNK_OVERLAP || 120));
function splitToChunks(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return []; const out: string[] = [];
  for (let i = 0; i < clean.length; i += Math.max(1, (size - overlap))) { out.push(clean.slice(i, i + size)); if (i + size >= clean.length) break; }
  return out.slice(0, 40);
}
async function embedChunk(inputs: string[]): Promise<number[][]> {
  const r = await fetch(EMBED_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: EMBED_MODEL, input: inputs }) });
  const text = await r.text(); if (!r.ok) throw new Error(`Embedding failed: HTTP ${r.status} — ${text.slice(0, 400)}`);
  const j = JSON.parse(text); return j.data.map((d: any) => d.embedding);
}
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH); let tries = 0;
    while (true) { try { out.push(...(await embedChunk(slice))); break; } catch (e) { tries += 1; if (tries >= 4) throw e; await new Promise(r => setTimeout(r, 500 * tries)); } }
  }
  return out;
}
function norm(u: string){ try{ const x = new URL(u); return x.toString(); } catch { return ""; } }
async function fetchText(url: string){
  const html = await fetch(url, { cache: "no-store" as any, headers: { "User-Agent": "Mozilla/5.0 KomoBot/1.0" } }).then(r=>r.text());
  const $ = cheerio.load(html); const title = ($("meta[property='og:title']").attr("content") || $("title").text() || url).trim();
  let main = $("main").text(); if (!main) main = $("article").text(); if (!main) main = $("body").text();
  const clean = (main || "").replace(/\s+/g, " ").trim(); return { title, content: clean };
}
export async function buildIndex(){
  const domains = (process.env.ALLOWED_DOMAINS || "").split(/\s*,\s*/).filter(Boolean);
  const extra = (process.env.RAG_EXTRA_URLS || "").split(/\s*,\s*/).filter(Boolean);
  const urls: string[] = [];
  for (const e of extra) { const u = norm(e); if (u) urls.push(u); }
  if (!urls.length) for (const d of domains) urls.push(norm(d));
  const limited = urls.slice(0, MAX_CRAWL);
  const docs: Doc[] = [];
  for (const u of limited) { try { const { title, content } = await fetchText(u); for (const ch of splitToChunks(content)) docs.push({ url: u, title, content: ch }); } catch {} }
  if (!docs.length) throw new Error("No pages fetched");
  const embs = await embedBatch(docs.map(d => d.content)); docs.forEach((d,i)=>d.embedding = embs[i]);
  INDEX = docs; return { docs: INDEX.length };
}
function cos(a: number[], b: number[]){ let d=0,na=0,nb=0; for (let i=0;i<a.length;i++){ d+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; } return d/(Math.sqrt(na)*Math.sqrt(nb)); }
export async function searchRag(query: string, k = 6): Promise<Hit[]>{
  if (!INDEX.length) throw new Error("Index empty; call /api/rag/reindex first");
  const [q] = await embedBatch([query]);
  const scored = INDEX.map(d => ({ d, score: cos(d.embedding!, q) })).sort((a,b)=>b.score-a.score).slice(0,k).map(({d,score})=>({ url:d.url, title:d.title, score, snippet:d.content.slice(0,600) }));
  return scored;
}
