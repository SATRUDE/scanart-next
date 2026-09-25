// The V2 launch gate (docs/v2-seo.md, "Sign-off gate").
//
// Fetches every URL in production's sitemap from production and from a
// candidate (the dev server or a preview deployment), as Googlebot, and
// compares what search reads: title, description, canonical, hreflang,
// robots, JSON-LD types, the H1, the word count in <main>, internal links
// and image alt text. No other test renders a page's head or JSON-LD, so
// this is the only guard against a redesign quietly dropping them.
//
//   node scripts/v2/seo-diff.mjs                       # candidate = http://localhost:3100
//   CANDIDATE=https://<preview>.vercel.app node scripts/v2/seo-diff.mjs
//   node scripts/v2/seo-diff.mjs --only /product/      # a subset of paths
//   node scripts/v2/seo-diff.mjs --json out.json       # full results to a file
//
// Exit code 1 when a blocking difference is found.

const PROD = process.env.PROD || 'https://www.scandinavianart.co.uk';
const CAND = process.env.CANDIDATE || 'http://localhost:3100';
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

const decode = s => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const text = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-GB' }, redirect: 'manual' });
      const body = res.status >= 300 && res.status < 400 ? '' : await res.text();
      return { status: res.status, location: res.headers.get('location'), body };
    } catch (e) {
      if (i === 2) return { status: 0, error: String(e), body: '' };
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function meta(html, attr, name) {
  const re = new RegExp(`<meta[^>]*${attr}="${name}"[^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag ? decode(tag.match(/content="([^"]*)"/i)?.[1] ?? '') : null;
}

function jsonLdTypes(html) {
  const types = new Set();
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = v => {
        if (Array.isArray(v)) return v.forEach(walk);
        if (v && typeof v === 'object') {
          if (v['@type']) [].concat(v['@type']).forEach(t => types.add(t));
          Object.values(v).forEach(walk);
        }
      };
      walk(JSON.parse(m[1]));
    } catch {
      types.add('INVALID_JSON');
    }
  }
  return [...types].sort();
}

function extract(html, base) {
  const head = html.split(/<\/head>/i)[0] || '';
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
  const main = body.match(/<main[\s\S]*?<\/main>/i)?.[0] || body;
  const links = new Set();
  for (const m of body.matchAll(/<a[^>]*href="([^"#?]*)[^"]*"/gi)) {
    const href = m[1];
    if (href.startsWith('/') && !href.startsWith('//')) links.add(href.replace(/\/$/, '') || '/');
    else if (href.startsWith(base) || href.startsWith(PROD)) links.add(href.replace(base, '').replace(PROD, '') || '/');
  }
  const alts = [...body.matchAll(/<img[^>]*>/gi)].map(m => m[0]).map(tag => ({
    alt: decode(tag.match(/alt="([^"]*)"/i)?.[1] ?? '__MISSING__'),
  }));
  const hreflang = {};
  for (const m of head.matchAll(/<link[^>]*rel="alternate"[^>]*>/gi)) {
    const lang = m[0].match(/hreflang="([^"]+)"/i)?.[1];
    const href = m[0].match(/href="([^"]+)"/i)?.[1];
    if (lang && href) hreflang[lang] = href.replace(PROD, '').replace(base, '');
  }
  return {
    lang: html.match(/<html[^>]*lang="([^"]+)"/i)?.[1] ?? null,
    title: decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim(),
    description: meta(head, 'name', 'description'),
    robots: meta(head, 'name', 'robots'),
    canonical: (head.match(/<link[^>]*rel="canonical"[^>]*>/i)?.[0].match(/href="([^"]+)"/i)?.[1] ?? '').replace(PROD, '').replace(base, '') || null,
    hreflang,
    ogType: meta(head, 'property', 'og:type'),
    ogImage: meta(head, 'property', 'og:image') ? 'set' : null,
    jsonld: jsonLdTypes(html),
    h1: [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => text(m[1])),
    words: (text(main).match(/[\p{L}\p{N}]+/gu) || []).length,
    links,
    images: alts.length,
    imagesWithoutAlt: alts.filter(a => a.alt === '__MISSING__').length,
  };
}

function compare(path, a, b) {
  const block = [];
  const warn = [];
  const eq = (k, x, y) => { if (JSON.stringify(x) !== JSON.stringify(y)) block.push(`${k}: ${JSON.stringify(x)} → ${JSON.stringify(y)}`); };
  eq('lang', a.lang, b.lang);
  eq('title', a.title, b.title);
  eq('description', a.description, b.description);
  eq('robots', a.robots, b.robots);
  eq('canonical', a.canonical, b.canonical);
  eq('hreflang', a.hreflang, b.hreflang);
  eq('og:type', a.ogType, b.ogType);
  if (a.ogImage && !b.ogImage) block.push('og:image missing');
  const lost = a.jsonld.filter(t => !b.jsonld.includes(t));
  if (lost.length) block.push(`JSON-LD types lost: ${lost.join(', ')}`);
  if (b.jsonld.includes('INVALID_JSON')) block.push('JSON-LD does not parse');
  if (b.h1.length !== 1) block.push(`H1 count ${b.h1.length}: ${JSON.stringify(b.h1)}`);
  else if (a.h1[0] && a.h1[0] !== b.h1[0]) warn.push(`H1 changed: "${a.h1[0]}" → "${b.h1[0]}"`);
  if (b.words < a.words * 0.85) block.push(`main words ${a.words} → ${b.words} (${Math.round((b.words / a.words - 1) * 100)}%)`);
  else if (b.words < a.words) warn.push(`main words ${a.words} → ${b.words}`);
  const lostLinks = [...a.links].filter(l => !b.links.has(l) && !/^\/(api|_next)\//.test(l));
  if (lostLinks.length) block.push(`internal links lost (${lostLinks.length}): ${lostLinks.slice(0, 12).join(' ')}${lostLinks.length > 12 ? ' …' : ''}`);
  if (b.imagesWithoutAlt > a.imagesWithoutAlt) block.push(`images without alt: ${a.imagesWithoutAlt} → ${b.imagesWithoutAlt}`);
  return { path, block, warn };
}

async function sitemapPaths() {
  const { body } = await get(`${PROD}/sitemap.xml`);
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(PROD, '') || '/');
}

async function pool(items, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const paths = (await sitemapPaths()).filter(p => !only || p.includes(only));
console.log(`Comparing ${paths.length} URLs: ${PROD} → ${CAND}\n`);
const results = await pool(paths, async path => {
  const [p, c] = await Promise.all([get(PROD + path), get(CAND + path)]);
  if (p.status !== 200) return { path, block: [], warn: [`production returned ${p.status}${p.location ? ' → ' + p.location : ''}`] };
  if (c.status !== 200) return { path, block: [`candidate returned ${c.status}${c.location ? ' → ' + c.location : ''}${c.error ? ' ' + c.error : ''}`], warn: [] };
  return compare(path, extract(p.body, PROD), extract(c.body, CAND));
});

let blocking = 0;
for (const r of results) {
  if (!r.block.length && !r.warn.length) continue;
  console.log(r.path);
  for (const b of r.block) { console.log(`  ✗ ${b}`); blocking++; }
  for (const w of r.warn) console.log(`  · ${w}`);
}
const clean = results.filter(r => !r.block.length).length;
console.log(`\n${clean}/${results.length} URLs with no blocking difference; ${blocking} blocking differences.`);
if (jsonOut) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(jsonOut, JSON.stringify(results, null, 2));
}
process.exit(blocking ? 1 : 0);
