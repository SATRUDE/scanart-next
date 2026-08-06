// Sync journal articles from the socialagent database (Neon) into
// public/notion-data/ at build time. Since 2026-08-05 the Article table in
// socialagent is the store of record (it replaced the Notion Journal
// articles DB); bodies are markdown and are converted here into the block
// JSON shape the NotionBlockRenderer already consumes, so the renderer and
// article pages need no changes.
//
// Env: ARTICLES_DATABASE_URL (or DATABASE_URL) — the socialagent Neon
// connection string. Absent locally: the committed snapshot is kept. Absent
// on a production build: fail, a stale snapshot would 404 newer articles.
import fs from 'node:fs/promises';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const url = process.env.ARTICLES_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  if (process.env.VERCEL_ENV === 'production') {
    console.error('[sync-articles] ARTICLES_DATABASE_URL is required for a production build but is not set. Refusing to ship the committed fallback snapshot.');
    process.exit(1);
  }
  console.warn('[sync-articles] no database URL set; keeping the committed snapshot.');
  process.exit(0);
}

const sql = neon(url);
const OUT_DIR = path.join(process.cwd(), 'public', 'notion-data');

// --- markdown -> Notion-shaped blocks -------------------------------------

function segment(content, opts = {}) {
  return {
    type: 'text',
    plain_text: content,
    href: opts.href ?? null,
    text: { content, link: opts.href ? { url: opts.href } : null },
    annotations: {
      bold: Boolean(opts.bold),
      italic: Boolean(opts.italic),
      code: Boolean(opts.code),
      strikethrough: false,
      underline: false,
    },
  };
}

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;

// Inline markdown -> rich-text segments. Link text gets a nested pass so
// [**bold**](url) keeps both the link and the bold.
function inlineToSegments(text, inherited = {}) {
  const segments = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) segments.push(segment(text.slice(last, m.index), inherited));
    if (m[1] !== undefined) {
      segments.push(...inlineToSegments(m[1], { ...inherited, href: m[2] }));
    } else if (m[3] !== undefined) {
      segments.push(segment(m[3], { ...inherited, bold: true }));
    } else if (m[4] !== undefined) {
      segments.push(segment(m[4], { ...inherited, italic: true }));
    } else {
      segments.push(segment(m[5], { ...inherited, code: true }));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push(segment(text.slice(last), inherited));
  return segments.filter((s) => s.plain_text.length > 0);
}

function markdownToBlocks(markdown) {
  const blocks = [];
  let n = 0;
  const push = (type, text) => {
    blocks.push({
      object: 'block',
      id: `md-${++n}`,
      type,
      has_children: false,
      [type]: type === 'divider' ? {} : { rich_text: inlineToSegments(text) },
    });
  };
  for (const raw of (markdown ?? '').split(/\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('### ')) push('heading_3', line.slice(4));
    else if (line.startsWith('## ')) push('heading_2', line.slice(3));
    else if (line.startsWith('# ')) push('heading_1', line.slice(2));
    else if (line.startsWith('- ')) push('bulleted_list_item', line.slice(2));
    else if (/^\d+\. /.test(line)) push('numbered_list_item', line.replace(/^\d+\. /, ''));
    else if (line.startsWith('> ')) push('quote', line.slice(2));
    else if (line === '---') push('divider', '');
    else push('paragraph', line);
  }
  return blocks;
}

// --- sync ------------------------------------------------------------------

const parse = (json, fallback) => {
  try {
    const v = JSON.parse(json ?? 'null');
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

const rows = await sql`SELECT * FROM "Article" ORDER BY "createdAt" DESC`;

const articles = rows.map((r) => ({
  id: r.id,
  slug: r.slug ?? '',
  title: r.title,
  excerpt: r.excerpt ?? '',
  published: r.status === 'PUBLISHED',
  featured: Boolean(r.featured),
  image: r.image ?? '',
  author: '',
  category: r.category ?? '',
  tags: parse(r.tags, []),
  relatedArticles: parse(r.relatedArticles, []),
  selectedArtworkIds: parse(r.selectedArtworkIds, []),
  created_time: r.createdAt.toISOString(),
  last_edited_time: r.updatedAt.toISOString(),
}));

await fs.mkdir(OUT_DIR, { recursive: true });

// Drop the old per-article block files (Notion page ids and previous runs'
// cuids) so removed articles disappear instead of lingering.
for (const entry of await fs.readdir(OUT_DIR)) {
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}\.json$/.test(entry) || /^c[a-z0-9]{20,}\.json$/.test(entry)) {
    await fs.rm(path.join(OUT_DIR, entry));
  }
}

await fs.writeFile(path.join(OUT_DIR, 'articles.json'), JSON.stringify(articles, null, 2));
for (const r of rows) {
  await fs.writeFile(
    path.join(OUT_DIR, `${r.id}.json`),
    JSON.stringify(markdownToBlocks(r.body), null, 2),
  );
}

console.log(`[sync-articles] wrote ${articles.length} articles (${articles.filter((a) => a.published).length} published) from Neon.`);

// The inspiration wall: scenes tagged on the socialagent Inspiration page.
const sceneRows = await sql`SELECT * FROM "InspireScene" ORDER BY "createdAt" ASC`;
const scenes = sceneRows.map((r) => ({
  image: r.imageUrl,
  alt: r.alt,
  slugs: (() => { try { const v = JSON.parse(r.slugs); return Array.isArray(v) ? v : []; } catch { return []; } })(),
  width: r.width,
  height: r.height,
}));
await fs.writeFile(path.join(OUT_DIR, 'inspire.json'), JSON.stringify(scenes, null, 2));
console.log(`[sync-articles] wrote ${scenes.length} inspire scenes from Neon.`);
