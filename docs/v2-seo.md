# Scandinavian Art V2: SEO contract

Written 25 September 2026, before the V2 build. The rule is simple: **V2 changes how pages look, never what they tell search.** Every item below is a launch blocker unless marked otherwise.

## What search gives the site today (Search Console, 26 June to 23 September 2026)

- 136 clicks and 13,663 impressions (web 7,974, image 5,689). 102 of 120 sitemap URLs are indexed.
- Clicks by page type:

  | Page type | Clicks | Impressions |
  |---|---|---|
  | home | 49 | 2,896 |
  | articles | 34 | 1,982 |
  | collections | 10 | 590 |
  | categories | 8 | 970 |
  | artists | 7 | 140 |

  Products, /about, /artists and /journal bring the rest.
- Top queries: scandinavian art (417 impressions), nordic art (125), nordic artwork (107), scandi art, and artist names (renate thor, sia siamos).
- Image search earns mostly on journal room scenes and /about (493 impressions).

## Where the V2 designs would lose ground, and what V2 does instead

1. **Pages with no V2 design.** Build them from V2 components, keeping all copy, FAQs, JSON-LD and cross-links:
   - `/category/[slug]` (3)
   - `/collection/[slug]` (5)
   - `/scandinavian-wall-art`
   - `/nordic-art`
   - `/gallery-wall-planner`
   - `/artists/how-it-works`
   - `/privacy`, `/terms`, `/feedback`
   - the Norwegian twins

   Template: Page header + the Prints grid + Content section (the text, FAQ and links bodies) + Explore the shop.

2. **Homepage H1.** The design says "Original prints by Nordic artists." The live H1 is "Explore a curated collection of contemporary Scandinavian art", and the homepage's top query is "scandinavian art".
   - V2 H1 (proposed, Mark to confirm): **"Original Scandinavian art, printed to order."**
   - The title and meta description stay as they are.

3. **Homepage category links.** The live homepage links all three categories. The V2 homepage has none, and the V2 footer drops the category and collection links the live footer carries on every page.
   - V2 adds the Explore the shop block to the homepage.
   - The footer keeps a crawlable list of categories, collections, the wall-art page and /nordic-art, styled in V2. This can be a second link column.

4. **Duplicate copy.** The V2 Prints page's long text reuses the `/nordic-art` copy (heading "Nordic art, from folk tradition to now"). On /products, V2 uses its own intro and Content section copy, and links to /nordic-art instead of repeating it.

5. **Norwegian.** New V2 copy (hero, How the shop works, artist "At a glance", Fill the frame, checkout and so on) needs Norwegian in `lib/i18n/no.ts` in the same change. No English strings on /no pages.

6. **Help answers.** Today they exist only in the JSON-LD; the accordion does not render closed panels (checked on the live page). V2's Question component renders the answer in the HTML and hides it with CSS (`<details>` or `hidden` + `forceMount`). This is a gain, not just a preservation.

7. **Page speed.** The homepage wall section (WebGL), the product video, the footer season videos and the About window animation must:
   - render a server image first (the LCP candidate stays an `<img>`);
   - load the script and video lazily and below the fold;
   - respect reduced motion;
   - never move layout on load.

   Fonts go through `next/font` (self-hosted Hedvig Letters Serif and Sans, `display: swap`).

8. **Search overlay.** It submits to `/products?q=` as the live header does, or to a new `/search?q=`. A new search page must be `noindex, follow` and absent from the sitemap.

## Must-preserve checklist

This is the full inventory of today's SEO behaviour, with file references, as of origin/main 7ad2cf9. Tick every item before launch.

### Document and head
- [ ] **Root layouts.** Keep the two root layouts (`lang="en"` / `lang="no"` in the HTML), with every page still static.
- [ ] **Site metadata.** Keep `siteMetadata`: metadataBase, the title template, default description, `index, follow`, the Google and Pinterest verification tags, and the default OG/Twitter image.
- [ ] **RSS link.** Keep the raw RSS `<link rel="alternate">` in `<head>`.
- [ ] **Social cards.** A page with its own `openGraph`/`twitter` restates siteName, locale, image and handle (use `socialCard`).
- [ ] **Product meta tags.** Keep `og:type=product`, `og:price:*`, `product:price:*` and `product:availability` as `<meta property>` tags on product pages.
- [ ] **Canonicals.** Every indexable page has a self canonical (`/no/...` on Norwegian pages).
- [ ] **hreflang.** Every EN/NO pair uses `hreflangPair` on both sides, with x-default = English. `/nordic-art`, `/gallery-wall-planner` and `/article/*` have no hreflang.
- [ ] **Titles and descriptions.** Keep every rule:
  - `metaTitle`;
  - absolute titles (product, wall-art, nordic-art, planner, /no home);
  - product buyer descriptions or `metaSnippet`;
  - article `clipToLength`;
  - `artistMetaTitle` / `artistMetaDescription`;
  - the 60/155-character budgets.
- [ ] **noindex.** Leave it exactly as today:
  - checkout: noindex,follow, with no canonical;
  - feedback: noindex,follow;
  - how-it-works: noindex,nofollow, unlinked, not in the sitemap, not blocked in robots;
  - preview: noindex,nofollow.

### Structured data (server-rendered)
- [ ] **Home:** `WebSite` + publisher `Organization` (logo, sameAs).
- [ ] **Product:** `Product` with ImageObject licence fields, brand and creator = artist, `Offer` (GBP lowest price, availability, rolling `priceValidUntil`, NewCondition, 14-day `MerchantReturnPolicy`), and `BreadcrumbList`.
- [ ] **Category, collection, wall-art, nordic-art:** `FAQPage` + `CollectionPage`/`ItemList` + `BreadcrumbList`.
- [ ] **Artist:** `Person` + `CollectionPage`/`ItemList` + `BreadcrumbList`.
- [ ] **Article:** `Article` + `BreadcrumbList`.
- [ ] **/products, /artists, /journal:** `CollectionPage` + `ItemList`.
- [ ] **/inspire:** `ImageGallery` of `ImageObject`, with `about` as plain URLs.
- [ ] **/about:** `AboutPage`. **/help:** `FAQPage`. **Planner:** `FAQPage` + `WebApplication`.
- [ ] **FAQ visibility.** Every FAQ in JSON-LD is also visible as question and answer text.

### Headings and content
- [ ] **H1.** Exactly one H1 per page, with today's text:
  - product name;
  - landing heading;
  - artist name;
  - article title;
  - Artists, Journal, Inspire, Help, legal titles, About line, planner line;
  - home per item 2 above.
- [ ] **Landing copy stays in the HTML.** Both intros, the styling or framing section and the FAQs, at roughly these lengths: categories ~340 words, collections 465-610, wall-art ~600, nordic-art ~535. Any "read more" clamps with CSS only.
- [ ] **Grid headings.** An h2 (visible or sr-only) above product grids, and card titles as headings.
- [ ] **Product content:**
  - catalogue description;
  - trial listing summary;
  - the artist section with the full bio and an artist link. The V2 artist quote is in addition to this, not a replacement.
- [ ] **Artist content:** bio, the "Prints by {name}" h2, the editorial h2 with its two paragraphs and inline links, and "More artists".
- [ ] **Planner copy** stays below the tool.
- [ ] **Visible breadcrumbs** on product, artist, article, legal and apply pages.

### Internal links
- [ ] **Footer.** In the served HTML, linking:
  - all categories, all collections, wall-art, and /nordic-art (English only);
  - about, inspire, journal, artists, help, feedback, shop;
  - privacy, terms, delivery.

  Also keep the crawlable "Les på norsk" / "Read in English" link. Everything stays inside /no on Norwegian pages.
- [ ] **Header.** Top nav as real links in the HTML: Prints, Inspire, Journal, Artists, About and home.
- [ ] **Landing cross-links.** `LandingCrossLinks` on every landing (V2: Explore the shop). It never links to the page itself, and includes /nordic-art on English pages only.
- [ ] **/products filters.** Category and collection filters on /products are real `<a>` links (V2 Filter bar).
- [ ] **Homepage links:**
  - the "Scandinavian wall art" text link;
  - categories;
  - hero prints;
  - top artists;
  - 3 journal cards (featured first);
  - an Inspire link.
- [ ] **Landing paragraphs.** The wall-art room paragraph with its collection links, and the nordic-art artists paragraph.
- [ ] **Articles and journal:**
  - "Keep browsing" landing links;
  - "Prints featured in this piece";
  - "More articles" (curated, reciprocal, fill);
  - the journal books-series hub.
- [ ] **Collections.** The related-article link, and the planner link on living-room.
- [ ] **Inspire.** The "Featuring {print} by {artist}" links and the closing collection links.
- [ ] **Products and artists.** Product "More prints like this" (was "You may also like"), and the apply links on the artists hubs.

### Images
- [ ] **Delivery.** next/image (AVIF, then WebP) for grids and cards; no raw `<img>` in grids.
- [ ] **Preloads:**
  - the first 4 grid cards;
  - the first product image;
  - the home hero image;
  - the article hero;
  - the first journal card;
  - the first Inspire scene;
  - the planner hero.
- [ ] **Alt text:**
  - `printImageAlt` / `sceneImageAlt` in the page's language;
  - the scene alt where a scene is shown;
  - the About hero alt from the catalogue;
  - artist photo alt = name;
  - `shopScenes` alts.

  The V2 About hero keeps a catalogue image with an artist-named alt: /about is the second-biggest image-search page.
- [ ] **Hosting.** Images stay on our own domain. The committed WebP twins for Merchant Center stay.

### Routing, sitemap and feeds
- [ ] **URLs.** No URL changes. All `next.config.ts` redirects stay, and the proxy's Norway 302 never applies to crawlers. No trailing slashes. English slugs on /no.
- [ ] **Sitemap and robots.** Sitemap entries, alternates and image entries stay as today. The lastmod floors stay, with dates set by hand, never the build time. `robots.ts` stays unchanged.
- [ ] **At launch:** bump `CATALOGUE_REVISED`, `HOME_REVISED` and the static-page dates (the templates really changed), then resubmit the sitemap.
- [ ] **Feeds.** `/feed.xml` and `/product-feed.xml` stay unchanged.
- [ ] **Static rendering.** /products stays statically prerendered with the grid in the HTML. Journal filter deep links apply after hydration.

## Fixed along the way (known issues today, `docs/v2-seo.md` owner: the V2 build)
- Norwegian category, collection and artist ItemLists and breadcrumbs point at English URLs.
- Help answers are missing from the HTML.
- Header category links are not crawlable (mobile menu only).
- Inspire `contentUrl` is relative.
- The /no hero uses the same scene in both slots.
- Article `datePublished` vs RSS `published_time`.

## Sign-off gate
Before launch, fetch every sitemap URL on the V2 preview as Googlebot and diff it against production. Compare:
- title, description, canonical, hreflang, robots;
- JSON-LD types and key fields;
- the H1;
- word count in `<main>`;
- internal link count and targets.

The script lives in `scripts/seo-diff.mjs` (to write). No existing test renders a page's head or JSON-LD, so this diff is the only real guard.

After launch, watch `/api/search` (web **and** image) and `/api/index-status` weekly for four weeks. A dip of a week or two while Google recrawls is normal. A lasting drop on one page type points at a checklist item.

## Accepted differences (Mark's decisions, 2026-09-26)
The sign-off diff against production will show these; each was decided on purpose, and the rest must stay clean.
- **Footer "Les på norsk" / "Read in English" removed** (every page loses its one link to its twin). The language switcher does it for people; hreflang in the head and sitemap alternates still pair every page for search.
- **No artist or print counts in copy.** Meta descriptions on the landings, /products and /nordic-art changed; the /nordic-art title is now "Nordic Art: Prints by Independent Nordic Artists".
- **"More from the journal" shows three articles at most** (curated first, then articles that name this one, then same category). Articles lose some article-to-article links; every article is still linked from /journal.
- **The visible product breadcrumb stops at Art Prints;** the BreadcrumbList JSON-LD keeps the product.
- **The landings' visible breadcrumb is replaced by the Prints filter bar;** the BreadcrumbList JSON-LD is unchanged.
