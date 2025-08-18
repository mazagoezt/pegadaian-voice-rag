import * as cheerio from "cheerio";

export function scrapeWithFallback(html: string) {
  const $ = cheerio.load(html);
  const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
  let textBlocks: string[] = [];
  const pick = (sel: string) => ($(sel).text() || "").replace(/\s+/g, " ").trim();

  textBlocks.push(pick("main"));
  textBlocks.push(pick("article"));
  textBlocks.push(pick("body"));
  textBlocks.push(pick("noscript"));
  textBlocks.push(pick("h1, h2, h3, h4, h5, h6"));
  textBlocks.push(pick("p, li"));

  const metaDesc = ($("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "").trim();
  if (metaDesc) textBlocks.push(metaDesc);

  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const j = JSON.parse($(el).contents().text());
      const items = Array.isArray(j) ? j : [j];
      for (const it of items) {
        if (typeof it === "object") {
          if (it.description) textBlocks.push(String(it.description));
          if (it.headline) textBlocks.push(String(it.headline));
        }
      }
    } catch {}
  });

  const content = textBlocks.join(" ").replace(/\s+/g, " ").trim();
  return { title: title || "", content };
}
