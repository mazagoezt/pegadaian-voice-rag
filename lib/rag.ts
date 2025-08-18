import * as cheerio from "cheerio";

export type Doc = { url: string; title: string; content: string; embedding?: number[] };
export type Hit = { url: string; title: string; snippet: string; score: number };

let INDEX: Doc[] = [];

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36 KomoBot/1.0";
const EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-large";
const MAX_CRAWL = Number(process.env.MAX_CRAWL_URLS || 40);
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 1200);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 150);

function splitToChunks(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += Math.max(1, (size - overlap))) {
    out.push(clean.slice(i, i + size));
    if (i + size >= clean.length) break;
  }
  return out;
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

async function discoverLinksFromHome(domain: string): Promise<string[]> {
  try {
    const res = await fetch(domain, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const origin = new URL(domain).origin;
    const hrefs = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = String($(el).attr("href") || "").trim();
      if (!href) return;
      try {
        const u = new URL(href, origin);
        if (u.origin === origin && /(produk|product|layanan|service|tentang|about|faq|tabungan|emas|gadai|pembiayaan|investasi|simulasi|lokasi|hubungi)/i.test(u.pathname)) {
          hrefs.add(u.toString());
        }
      } catch {}
    });
    return Array.from(hrefs);
  } catch {
    return [];
  }
}

async function fetchSitemapUrls(domain: string): Promise<string[]> {
  const urls: Set<string> = new Set();
  // sitemap.xml
  try {
    const sm = new URL("/sitemap.xml", domain).toString();
    const res = await fetch(sm, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any });
    if (res.ok) {
      const xml = await res.text();
      const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
      for (const u of locs) if (/(pegadaian\.co\.id|sahabat\.pegadaian\.co\.id)/.test(u)) urls.add(u);
    }
  } catch {}
  // robots.txt -> Sitemap
  try {
    const robots = new URL("/robots.txt", domain).toString();
    const rr = await fetch(robots, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any });
    if (rr.ok) {
      const txt = await rr.text();
      const smLines = [...txt.matchAll(/sitemap:\s*(\S+)/gi)].map(m => m[1]);
      for (const line of smLines) {
        try {
          const r2 = await fetch(line, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any });
          if (r2.ok) {
            const xml = await r2.text();
            const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
            for (const u of locs) if (/(pegadaian\.co\.id|sahabat\.pegadaian\.co\.id)/.test(u)) urls.add(u);
          }
        } catch {}
      }
    }
  } catch {}
  // discovery dari homepage
  try {
    const discovered = await discoverLinksFromHome(domain);
    for (const d of discovered) urls.add(d);
  } catch {}
  // seeds kuat
  const origin = new URL(domain).origin;
  const seedsByHost: Record<string, string[]> = {
    "https://www.pegadaian.co.id": [
      "https://www.pegadaian.co.id/produk/gadai-emas",
      "https://www.pegadaian.co.id/produk/gadai-non-emas",
      "https://www.pegadaian.co.id/produk/gadai-tabungan-emas",
      "https://www.pegadaian.co.id/produk/titipan-emas-fisik",
      "https://www.pegadaian.co.id/hubungi-kami",
      "https://www.pegadaian.co.id/lokasi-cabang"
    ],
    "https://www.sahabat.pegadaian.co.id": [
      "https://www.sahabat.pegadaian.co.id/produk-pegadaian/tabungan-emas",
      "https://www.sahabat.pegadaian.co.id/produk-pegadaian/gadai-dari-rumah",
      "https://www.sahabat.pegadaian.co.id/simulasi/simulasi-tabungan-emas"
    ]
  };
  const seeds = seedsByHost[origin] || [];
  for (const s of seeds) urls.add(s);
  if (urls.size === 0) urls.add(domain);
  const filtered = Array.from(urls).filter(u => /(pegadaian\.co\.id|sahabat\.pegadaian\.co\.id)/.test(u));
  return filtered;
}

async function fetchPageText(url: string) {
  const html = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" as any }).then(r => r.text());
  const $ = cheerio.load(html);
  const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
  const mainText = $("main").text() || $("article").text() || $("body").text();
  const content = (mainText || "").replace(/\s+/g, " ").trim();
  return { title: title || url, content };
}

export async function buildIndex() {
  const domains = (process.env.ALLOWED_DOMAINS || "").split(/\s*,\s*/).filter(Boolean);
  if (!domains.length) throw new Error("ALLOWED_DOMAINS not set");

  const urlsSet = new Set<string>();
  for (const d of domains) {
    try {
      const urls = await fetchSitemapUrls(d);
      urls.slice(0, Math.ceil(MAX_CRAWL / Math.max(1, domains.length))).forEach(u => urlsSet.add(u));
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
