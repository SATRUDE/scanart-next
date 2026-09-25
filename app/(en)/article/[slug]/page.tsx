import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TrackedLink } from '@/components/TrackedLink';
import { getAllArticles, getArticleBySlug, getArticleBlocks } from '@/lib/articles';
import { getProductBySlug, getProductsByArtworkIds } from '@/lib/products';
import { getArtistById } from '@/data/artists';
import { ArticleBody } from '@/components/ArticleBody';
import { ArticleCard } from '@/components/ArticleCard';
import { PrintCard } from '@/components/PrintCard';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { Hairline, Meta, SectionHeader } from '@/components/v2/ui';
import { ArticleBreadcrumb } from '@/components/v2/journal/ArticleBreadcrumb';
import { ShareLinks } from '@/components/v2/journal/ShareLinks';
import { ArticleArtists } from '@/components/v2/journal/ArticleArtists';
import { BASE_URL, OG_IMAGE, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';
import { getBrowseLinksForArticle } from '@/lib/article-browse';
import { selectRelatedArticles } from '@/lib/related-articles';
import { clipToLength } from '@/lib/meta-snippet';
import { metaTitle } from '@/lib/meta-title';
import { articleSceneSlugs } from '@/lib/shop-scenes';
import { getPublishedArtists } from '@/lib/published-artists';
import { articlePublishedAt, readingMinutes } from '@/lib/article-reading';

/** Story tile ratios for "More from the journal", in the Figma order. */
const MORE_RATIOS = ['tab:aspect-[4/5]', 'tab:aspect-[2/3]', 'tab:aspect-square'];

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  // A headline is written to read as a headline, not to leave 27 characters
  // spare for the layout's "| Scandinavian Art Gallery" suffix, so the journal
  // was where the templated title overflowed worst: 22 of 26 ran past the ~60
  // characters a result shows, including the site's biggest impression earner
  // (nordic-art-and-design-books, 243 impressions over the 28 days to 15 Aug,
  // cut at "worth ow..."). metaTitle keeps the suffix where it fits and drops
  // it where it would cost the headline, the same call the product pages make.
  const title = metaTitle(article.title);
  // Excerpts are teasers rather than stand-alone opening sentences, so they get
  // the plain clip and not metaSnippet's first-sentence rule, which would have
  // cut two of them to under 65 characters.
  const description = clipToLength(article.excerpt);

  return {
    title,
    description,
    alternates: {
      canonical: `/article/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      url: `${BASE_URL}/article/${article.slug}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      images: [article.image || OG_IMAGE],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: article.title,
      description,
      images: [article.image || OG_IMAGE],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const blocks = await getArticleBlocks(article.id);
  const browseLinks = getBrowseLinksForArticle(article.slug);
  const featuredPrints = await getProductsByArtworkIds(article.selectedArtworkIds || []);
  const allArticles = await getAllArticles();
  // Curated list, then every article that names this one, then a same-category
  // fill: see lib/related-articles.ts for why the block must point both ways.
  const relatedArticles = selectRelatedArticles(article, allArticles);
  const publishedArtists = await getPublishedArtists();
  // The makers of the featured prints, in the order their prints appear.
  const featuredArtistIds = [...new Set(featuredPrints.map(p => p.artistId).filter(Boolean))];
  const articleArtists = featuredArtistIds.flatMap(id => publishedArtists.find(a => a.id === id) ?? []);
  // Where the hero is one of the curated shop scenes, caption it with the
  // print it shows (Figma: "Hyttefrokost — Sia Siamos"). Otherwise no caption:
  // the image's alt already describes it, and a caption must not guess.
  const heroProduct = articleSceneSlugs[article.slug] ? await getProductBySlug(articleSceneSlugs[article.slug]) : null;
  const heroArtist = heroProduct?.artistId ? getArtistById(heroProduct.artistId)?.name : undefined;
  const url = `${BASE_URL}/article/${article.slug}`;
  const minutes = readingMinutes(blocks);

  return (
    <div className="page-x pb-section">
      <ArticleBody
        title={article.title}
        category={article.category}
        excerpt={article.excerpt}
        image={article.image}
        imageAlt={article.imageAlt}
        blocks={blocks}
        articleSlug={article.slug}
        breadcrumb={
          // Visible and linked, and the same three steps as the BreadcrumbList below.
          <ArticleBreadcrumb title={article.title} />
        }
        meta={
          <div className="flex flex-wrap items-center gap-x-[6px] gap-y-2 type-caption">
            <Meta items={[`${minutes} min read`, featuredPrints.length > 0 ? `${featuredPrints.length} ${featuredPrints.length === 1 ? 'print' : 'prints'}` : null]} />
            <span className="hidden items-center gap-[6px] tab:flex">
              <Hairline />
              <ShareLinks url={url} title={article.title} image={article.image ? new URL(article.image, BASE_URL).toString() : undefined} />
            </span>
          </div>
        }
        heroCaption={heroProduct ? <Meta items={[heroProduct.name, heroArtist]} /> : undefined}
      >
        {browseLinks.length > 0 && (
          <footer className="mt-12 flex flex-col gap-3 border-t border-ink pt-6 tab:mt-band">
            <p className="type-small">Keep browsing:</p>
            <ul className="flex flex-col gap-2">
              {browseLinks.map(link => (
                <li key={link.href}>
                  <TrackedLink
                    event="keep-browsing-click"
                    eventData={{ from: article.slug, to: link.href }}
                    href={link.href}
                    className="group/link inline-flex items-center type-body transition-colors hover:text-brand"
                  >
                    <span aria-hidden className="h-px w-0 bg-brand transition-[width,margin] duration-200 ease-out group-hover/link:mr-2 group-hover/link:w-3 motion-reduce:transition-none" />
                    <span>{link.label}</span>
                    <span aria-hidden className="ml-2">→</span>
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </ArticleBody>

      {featuredPrints.length > 0 && (
        // Gallery, running off the right edge (Figma "The places, in rooms"):
        // the prints at their own ratios, bottom edges shared, alternating 4-
        // and 3-column widths so the row is never a uniform grid.
        <section aria-labelledby="article-prints" className="mt-24 desk:mt-32">
          <h2 id="article-prints" className="border-t border-ink pt-4 type-h3">Prints featured in this piece</h2>
          <ul className="-mr-margin mt-group flex snap-x items-end gap-4 overflow-x-auto pr-margin pb-2 tab:gap-gutter">
            {featuredPrints.map((print, i) => (
              <li key={print.id} className={`shrink-0 snap-start ${i % 2 === 0 ? 'w-[240px] tab:w-[296px] desk:w-[405px]' : 'w-[240px] tab:w-[240px] desk:w-[296px]'}`}>
                <TrackedLink event="journal-to-product-click" eventData={{ article: article.slug, product: print.slug }} href={`/product/${print.slug}`}>
                  <PrintCard product={print} sizes="(max-width: 833px) 240px, 405px" />
                </TrackedLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {articleArtists.length > 0 && (
        <div className="mt-24 page-grid desk:mt-32">
          <div className="col-span-full tab:col-start-2 tab:col-span-6 desk:col-start-4 desk:col-span-6">
            <ArticleArtists artists={articleArtists} articleSlug={article.slug} />
          </div>
        </div>
      )}

      {relatedArticles.length > 0 && (
        <section aria-labelledby="article-more" className="mt-section">
          <SectionHeader id="article-more" title="More from the journal" link={{ href: '/journal', label: 'All stories' }} />
          {/* A row that scrolls sideways on mobile, three columns from tablet. */}
          <ul className="-mr-margin mt-12 flex gap-4 overflow-x-auto pr-margin tab:mr-0 tab:mt-band tab:grid tab:grid-cols-3 tab:gap-x-gutter tab:gap-y-band tab:overflow-visible tab:pr-0">
            {relatedArticles.map((ra, i) => (
              <li key={ra.id} className="w-[260px] shrink-0 tab:w-auto">
                <ArticleCard
                  article={ra}
                  imageAspectClass={`aspect-[4/5] ${MORE_RATIOS[i % 3]}`}
                  sizes="(max-width: 833px) 260px, 33vw"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <LandingCrossLinks artists={publishedArtists} className="mt-section" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt,
            // schema.org requires absolute image URLs; omit the field when there is no image
            ...(article.image ? { image: new URL(article.image, BASE_URL).toString() } : {}),
            // When it went live, not when the draft row was made: the same
            // date the RSS feed gives (docs/v2-seo.md, fixed along the way).
            datePublished: articlePublishedAt(article),
            ...(article.last_edited_time ? { dateModified: article.last_edited_time } : {}),
            // author is blank across the exported articles; the gallery is the
            // byline (Mark's call, 2026-07-09), a named writer becomes a Person
            author: article.author
              ? { '@type': 'Person', name: article.author }
              : {
                  '@type': 'Organization',
                  name: 'Scandinavian Art Gallery',
                  // Google-recommended author.url: a page that uniquely
                  // identifies the author. For the gallery byline that is the
                  // site homepage. A named Person author would point to a bio
                  // page; none exist yet, so the Person branch stays url-less.
                  url: BASE_URL,
                },
            publisher: {
              '@type': 'Organization',
              name: 'Scandinavian Art Gallery',
              logo: {
                '@type': 'ImageObject',
                url: `${BASE_URL}/images/scandinavian-art-gallery-og.jpg`,
              },
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
              { '@type': 'ListItem', position: 2, name: 'Journal', item: `${BASE_URL}/journal` },
              { '@type': 'ListItem', position: 3, name: article.title, item: `${BASE_URL}/article/${article.slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
