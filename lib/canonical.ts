function slugify(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function tokens(s: string) { return slugify(s).split("-").filter(Boolean); }

export function bestCanonicalUrl(query: string, extraCsv: string): string | null {
  const qTokens = tokens(query);
  const urls = (extraCsv || "").split(/\s*,\s*/).filter(Boolean);
  if (!urls.length) return null;

  let best: string | null = null;
  let bestScore = 0;

  for (const u of urls) {
    let score = 0;
    const slug = tokens(u).join("-");
    for (const t of qTokens) if (slug.includes(t)) score += 1;

    // Strong boosts for common product slugs
    const qSlug = qTokens.join("-");
    const boosts: [RegExp, number][] = [
      [/pinjaman-serbaguna/, 3],
      [/gadai-emas/, 3],
      [/gadai-non-emas/, 2],
      [/tabungan-emas/, 3],
      [/cicil-emas/, 2],
      [/kur-syariah/, 2],
      [/gadai-elektronik/, 2],
      [/gadai-kendaraan/, 2]
    ];
    for (const [re, b] of boosts) if (re.test(slug) && re.test(qSlug)) score += b;

    if (score > bestScore) { bestScore = score; best = u; }
  }
  // minimal threshold supaya tidak salah arah
  return bestScore >= 2 ? best : null;
}
