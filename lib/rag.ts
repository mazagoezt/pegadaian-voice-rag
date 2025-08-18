import * as cheerio from "cheerio";

export type Doc = { url: string; title: string; content: string; embedding?: number[] };
export type Hit = { url: string; title: string; snippet: string; score: number };

let INDEX: Doc[] = [];

const EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-large";
const MAX_CRAWL = Number(process.env.MAX_CRAWL_URLS || 80);
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 1200);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 150);

function splitToChunks(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += (size - overlap)) {
    out.push(clean.slice(i, i + size));
    if (i + size >= clean.length) break;
  }
  return out.length ? out : [clean];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const r = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!r.ok) throw new Error("Embedding failed");
  const j = await r.json();
  return j.data.map((d: any) => d.embedding);
}

async function fetchSitemapUrls(domain: string): Promise<string[]> {
  const url = new URL("/sitemap.xml", domain).toString();
  const res = await fetch(url);
  if (!res.ok) return [domain];
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  const filtered = urls.filter(u => /(produk|product|layanan|service|tentang|about|faq|syarat|ketentuan|unit|kantor|tabungan|emas|gadai|pembiayaan|investasi)/i.test(u));
  return filtered.length ? filtered : urls;
}

async function fetchPageText(url: string) {
  const html = await fetch(url, { headers: { "User-Agent": "Pegadaian-VoiceBot/1.0" } }).then(r => r.text());
  const $ = cheerio.load(html);
  const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
  const mainText = $("main").text() || $("article").text() || $("body").text();
  const content = mainText.replace(/\s+/g, " ").trim();
  return { title: title || url, content };
}

export async function buildIndex() {
  const domains = (process.env.ALLOWED_DOMAINS || "").split(/\s*,\s*/).filter(Boolean);
  if (!domains.length) throw new Error("ALLOWED_DOMAINS not set");

  const urlsSet = new Set<string>();
  for (const d of domains) {
    try {
      const urls = await fetchSitemapUrls(d);
      urls.slice(0, Math.ceil(MAX_CRAWL / domains.length)).forEach(u => urlsSet.add(u));
    } catch {}
  }
  const urls = Array.from(urlsSet).slice(0, MAX_CRAWL);

  const pages: Doc[] = [];
  for (const u of urls) {
    try {
      const { title, content } = await fetchPageText(u);
      const chunks = splitToChunks(content);
      for (const ch of chunks) pages.push({ url: u, title, content: ch });
    } catch {}
  }
  if (!pages.length) throw new Error("No pages fetched");

  const embs = await embedBatch(pages.map(p => p.content));
  pages.forEach((p, i) => (p.embedding = embs[i]));
  INDEX = pages;
  return { docs: INDEX.length };
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function searchRag(query: string, k = 4): Promise<Hit[]> {
  if (!INDEX.length) throw new Error("Index empty; call /api/rag/reindex first");
  const [qemb] = await embedBatch([query]);
  const scored = INDEX.map(d => ({ d, score: cosine(d.embedding!, qemb) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ d, score }) => ({
      url: d.url,
      title: d.title,
      score,
      snippet: d.content.slice(0, 400)
    }));
  return scored;
}