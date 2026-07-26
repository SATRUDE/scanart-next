import fs from 'fs/promises';
import path from 'path';
import { Client } from '@notionhq/client';

// Syncs journal articles from the Notion "Journal articles" database into
// public/notion-data/, which the site reads at runtime (see lib/articles.ts).
// Runs automatically before every build (prebuild), or manually: npm run sync
//
// Behaviour:
// - NOTION_API_KEY missing on a production deploy (VERCEL_ENV=production)
//   -> fail the build. The committed snapshot is only a fallback and can lag
//   behind Notion, so shipping it to production would silently 404 any newer
//   published article (it is in the sitemap but absent from the fallback JSON).
// - NOTION_API_KEY missing elsewhere (local dev, previews, CI worktrees)
//   -> skip with a warning, keep the committed snapshot so contributors can
//   build without the key
// - NOTION_API_KEY present  -> sync or die; a failed sync fails the build so a
//   half-written snapshot never ships
// - Only Published articles are exported; drafts stay out of the public JSON

const DATA_SOURCE_ID = process.env.NOTION_ARTICLES_DATA_SOURCE_ID || '24833fb2-2b5f-80f6-b886-000b12f3a786';
const OUT_DIR = path.join(process.cwd(), 'public', 'notion-data');

const apiKey = process.env.NOTION_API_KEY;
if (!apiKey) {
  if (process.env.VERCEL_ENV === 'production') {
    console.error('[sync-notion] NOTION_API_KEY is required for a production build but is not set. Refusing to ship the committed fallback snapshot, which may be stale and would 404 newer published articles.');
    process.exit(1);
  }
  console.warn('[sync-notion] NOTION_API_KEY not set; keeping the committed snapshot.');
  process.exit(0);
}

const notion = new Client({ auth: apiKey });

const plain = (rich) => (rich ?? []).map(r => r.plain_text ?? '').join('');
const names = (multi) => (multi ?? []).map(o => o.name);

function toArticle(page) {
  const p = page.properties;
  return {
    id: page.id,
    slug: plain(p['Slug']?.rich_text),
    title: plain(p['Title']?.title),
    excerpt: plain(p['Excerpt']?.rich_text),
    published: p['Published']?.checkbox ?? false,
    featured: p['Featured']?.checkbox ?? false,
    image: p['Featured Image']?.url ?? '',
    author: '',
    category: p['Category']?.select?.name ?? '',
    tags: names(p['Tags']?.multi_select),
    relatedArticles: names(p['Related Articles']?.multi_select),
    selectedArtworkIds: names(p['Selected Artwork IDs']?.multi_select),
    created_time: page.created_time,
    last_edited_time: page.last_edited_time,
  };
}

async function queryAllPages() {
  const pages = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function fetchBlocks(pageId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  for (const b of blocks.filter(b => b.has_children)) {
    console.warn(`[sync-notion] block ${b.id} (${b.type}) has nested children; nested content is not exported.`);
  }
  return blocks;
}

async function main() {
  const pages = await queryAllPages();
  const articles = pages.map(toArticle).filter(a => a.published);

  const missingSlug = articles.filter(a => !a.slug);
  if (missingSlug.length) {
    throw new Error(`Published articles missing a Slug: ${missingSlug.map(a => a.title).join(', ')}`);
  }

  // Remember the previous snapshot's article ids so stale block files get removed
  let previousIds = [];
  try {
    previousIds = JSON.parse(await fs.readFile(path.join(OUT_DIR, 'articles.json'), 'utf-8')).map(a => a.id);
  } catch { /* first run or missing snapshot */ }

  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const article of articles) {
    const blocks = await fetchBlocks(article.id);
    await fs.writeFile(path.join(OUT_DIR, `${article.id}.json`), JSON.stringify(blocks, null, 1));
    console.log(`[sync-notion] exported "${article.title}" (${blocks.length} blocks)`);
  }
  await fs.writeFile(path.join(OUT_DIR, 'articles.json'), JSON.stringify(articles, null, 1));

  const currentIds = new Set(articles.map(a => a.id));
  for (const staleId of previousIds.filter(id => !currentIds.has(id))) {
    await fs.rm(path.join(OUT_DIR, `${staleId}.json`), { force: true });
    console.log(`[sync-notion] removed stale article ${staleId}`);
  }

  console.log(`[sync-notion] done: ${articles.length} published articles.`);
}

main().catch((err) => {
  console.error('[sync-notion] sync failed:', err.message);
  process.exit(1);
});
