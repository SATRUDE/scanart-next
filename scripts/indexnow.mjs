// Tell IndexNow (Bing, Yandex, Seznam, Naver and the other participating
// engines) which pages changed, so they recrawl them without waiting.
// IndexNow is free and unmetered; this makes one POST per run.
//
//   node scripts/indexnow.mjs --since 2026-09-27T07:00:00Z   pages whose sitemap lastmod is newer
//   node scripts/indexnow.mjs https://www.scandinavianart.co.uk/journal   specific URLs
//   add --dry-run to print the list without sending it
//
// The key is public by design: IndexNow proves ownership by fetching
// /<key>.txt from the site, which lives in public/.
import { readdirSync } from 'node:fs';
import path from 'node:path';

const HOST = 'www.scandinavianart.co.uk';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function findKey() {
  const dir = path.join(process.cwd(), 'public');
  const file = readdirSync(dir).find(name => /^[0-9a-f]{32}\.txt$/.test(name));
  if (!file) throw new Error('No IndexNow key file (32 hex characters + .txt) in public/.');
  return file.replace(/\.txt$/, '');
}

async function changedSince(since) {
  const res = await fetch(`${ORIGIN}/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  const urls = [];
  for (const [, entry] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
    if (loc && lastmod && new Date(lastmod) > since) urls.push(loc);
  }
  return urls;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sinceIndex = args.indexOf('--since');
const explicit = args.filter((a, i) => a.startsWith('http') && i !== sinceIndex + 1);

let urls = explicit;
if (sinceIndex !== -1) {
  const since = new Date(args[sinceIndex + 1]);
  if (Number.isNaN(since.getTime())) throw new Error('--since needs an ISO date.');
  urls = [...urls, ...(await changedSince(since))];
}
urls = [...new Set(urls)].filter(u => new URL(u).host === HOST);

if (urls.length === 0) {
  console.log('IndexNow: nothing changed, nothing sent.');
  process.exit(0);
}
console.log(`IndexNow: ${urls.length} URL(s)\n${urls.join('\n')}`);
if (dryRun) process.exit(0);

const key = findKey();
const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList: urls.slice(0, 10000) }),
});
// 200 and 202 are both success (202: key not yet verified, accepted anyway).
console.log(`IndexNow responded ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
