import * as cheerio from "cheerio";
import { scrapeWithFallback } from "@/lib/scrape";

export type Doc = { url: string; title: string; content: string; embedding?: number[] };
export type Hit = { url: string; title: string; snippet: string; score: number };
export type Fee = { url: string; title: string; label: string; value: string; unit?: string; context?: string };

let INDEX: Doc[] = []; let FEES: Fee[] = [];

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36 KomoBot/1.2";
const EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small";
const BATCH = Math.max(1, Math.min(128, Number(process.env.EMBED_BATCH_SIZE || 32)));
const MAX_CRAWL = Math.max(1, Number(process.env.MAX_CRAWL_URLS || 10));
const CHUNK_SIZE = Math.max(400, Number(process.env.CHUNK_SIZE || 900));
const CHUNK_OVERLAP = Math.max(60, Number(process.env.CHUNK_OVERLAP || 120));
const ONLY_EXTRA = String(process.env.ONLY_EXTRA || "true").toLowerCase() === "true";

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

function pushFees(url: string, title: string, text: string) {
  const lines = (text || "").split(/(?<=\.)\s+/);
  const keyRe = /(biaya|tarif|sewa modal|bunga|margin|ujrah|administrasi|penitipan|layanan|pembukaan|penutupan|transfer|denda)/i;
  const valRe = /(rp\s?[:.]?\s?[0-9\.\,]+|[0-9]+\s?%|[0-9]+\s?(ribu|juta)|\brp\b)/i;
  for (const ln of lines) if (keyRe.test(ln) && valRe.test(ln)) { const label = (ln.match(keyRe) || [""])[0]; const value = (ln.match(valRe) || [""])[0]; FEES.push({ url, title, label: label.toLowerCase(), value, unit: /%/.test(value) ? "%" : undefined, context: ln.trim().slice(0, 240) }); }
}

async function discoverLinksFromHome(domain: string): Promise<string[]> {
  try {
    const res = await fetch(domain, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any });
    if (!res.ok) return []; const html = await res.text(); const $ = cheerio.load(html); const origin = new URL(domain).origin; const hrefs = new Set<string>();
    $("a[href]").each((_, el) => { const href = String($(el).attr("href") || "").trim(); try { const u = new URL(href, origin); if (u.origin.endsWith("pegadaian.co.id") && /(produk|product|layanan|service|faq|tabungan|emas|gadai|pembiayaan|investasi|simulasi|lokasi|hubungi|biaya|tarif|pinjaman)/i.test(u.pathname)) { hrefs.add(u.toString()); } } catch {} });
    return Array.from(hrefs);
  } catch { return []; }
}

async function fetchSitemapUrls(domain: string): Promise<string[]> {
  const urls: Set<string> = new Set();
  if (!ONLY_EXTRA) {
    try { const r = await fetch(new URL("/sitemap.xml", domain).toString(), { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any }); if (r.ok) { const xml = await r.text(); const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]); for (const u of locs) if (/(pegadaian\.co\.id)/.test(new URL(u).hostname)) urls.add(u); } } catch {}
    const discovered = await discoverLinksFromHome(domain); for (const d of discovered) urls.add(d);
  }
  const extra = (process.env.RAG_EXTRA_URLS || "").split(/\s*,\s*/).filter(Boolean);
  for (const e of extra) { try { const u = new URL(e); if (u.hostname.endsWith("pegadaian.co.id")) urls.add(u.toString()); } catch {} }
  if (urls.size === 0) urls.add(domain); return Array.from(urls);
}

async function fetchPageText(url: string) {
  const html = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any }).then(r => r.text());
  const { title, content } = scrapeWithFallback(html);
  const $ = cheerio.load(html);
  $("table").each((_, t) => { const rows: string[] = []; $(t).find("tr").each((_, tr) => { const cells = $(tr).find("th,td").map((i, td) => $(td).text().trim()).get(); if (cells.length) rows.push(cells.join(" | ")); }); if (rows.length) pushFees(url, title || url, rows.join(". ")); });
  pushFees(url, title || url, content);
  return { title: title || url, content };
}

export async function buildIndex() {
  FEES = []; const domains = (process.env.ALLOWED_DOMAINS || "").split(/\s*,\s*/).filter(Boolean);
  if (!domains.length) throw new Error("ALLOWED_DOMAINS not set");
  const urlsSet = new Set<string>();
  for (const d of domains) { try { const urls = await fetchSitemapUrls(d); urls.slice(0, Math.ceil(MAX_CRAWL / Math.max(1, domains.length))).forEach(u => urlsSet.add(u)); } catch {} }
  const urls = Array.from(urlsSet).slice(0, MAX_CRAWL);
  const pages: Doc[] = [];
  for (const u of urls) { try { const { title, content } = await fetchPageText(u); const chunks = splitToChunks(content); for (const ch of chunks) pages.push({ url: u, title, content: ch }); } catch {} }
  if (!pages.length) throw new Error("No pages fetched");
  const embs = await embedBatch(pages.map(p => p.content)); pages.forEach((p, i) => (p.embedding = embs[i])); 
  INDEX = pages; return { docs: INDEX.length, fees: FEES.length };
}

function cosine(a: number[], b: number[]): number { let dot=0,na=0,nb=0; for (let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; } return dot/(Math.sqrt(na)*Math.sqrt(nb)); }

export async function searchRag(query: string, k = 6): Promise<Hit[]> {
  if (!INDEX.length) throw new Error("Index empty; call /api/rag/reindex first");
  const [qemb] = await embedBatch([query]);
  const scored = INDEX.map(d => ({ d, score: cosine(d.embedding!, qemb) })).sort((a,b)=>b.score-a.score).slice(0,k).map(({d,score})=>({ url:d.url, title:d.title, score, snippet:d.content.slice(0,600) }));
  return scored;
}

export function searchFees(query: string): Fee[] {
  const q = (query || "").toLowerCase(); const terms = q.split(/\s+/).filter(Boolean);
  return FEES.filter(f => { const hay = (f.title + " " + f.label + " " + (f.context || "")).toLowerCase(); return terms.every(t => hay.includes(t)); }).slice(0, 12);
}
