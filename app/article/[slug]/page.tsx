import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TrackedLink } from '@/components/TrackedLink';
import Image from 'next/image';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getAllArticles, getArticleBySlug, getArticleBlocks } from '@/lib/articles';
import { getAllProducts } from '@/lib/products';
import { NotionBlockRenderer } from '@/components/NotionBlockRenderer';
import { PrintCard } from '@/components/PrintCard';
import { BASE_URL, OG_IMAGE, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';
import { getBrowseLinksForArticle } from '@/lib/article-browse';
import { clipToLength } from '@/lib/meta-snippet';
import { metaTitle } from '@/lib/meta-title';

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
  const allProducts = await getAllProducts();
  const featuredPrints = (article.selectedArtworkIds || [])
    .map(artworkSlug => allProducts.find(p => p.slug === artworkSlug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const allArticles = await getAllArticles();
  const relatedSlugs = article.relatedArticles || [];
  const relatedArticles = relatedSlugs.length > 0
    ? allArticles.filter(a => relatedSlugs.includes(a.slug))
    : allArticles.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <div className="container mx-auto px-8 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><TrackedLink event="breadcrumb-click" eventData={{ level: 'home' }} href="/">Home</TrackedLink></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><TrackedLink event="breadcrumb-click" eventData={{ level: 'journal' }} href="/journal">Journal</TrackedLink></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          {article.category && (
            <span className="text-sm text-muted-foreground uppercase tracking-wider">{article.category}</span>
          )}
          <h1 className="text-4xl text-neutral-900 mt-2 mb-4">{article.title}</h1>
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
          )}
        </header>

        {article.image && (
          <div className="relative aspect-[16/9] overflow-hidden bg-neutral-50 rounded mb-8">
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              preload
            />
          </div>
        )}

        {blocks.length > 0 && (
          <NotionBlockRenderer blocks={blocks} />
        )}

        {browseLinks.length > 0 && (
          <footer className="mt-12 border-t pt-8">
            <p className="text-sm text-muted-foreground">
              Keep browsing:{' '}
              {browseLinks.map((link, i) => (
                <span key={link.href}>
                  {i > 0 && ' · '}
                  <TrackedLink
                    event="keep-browsing-click"
                    eventData={{ from: article.slug, to: link.href }}
                    href={link.href}
                    className="underline underline-offset-2 hover:text-neutral-600 transition-colors"
                  >
                    {link.label}
                  </TrackedLink>
                </span>
              ))}
            </p>
          </footer>
        )}
      </article>

      {featuredPrints.length > 0 && (
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl text-neutral-900 mb-8">Prints featured in this piece</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {featuredPrints.map(print => (
              <TrackedLink key={print.id} event="journal-to-product-click" eventData={{ article: article.slug, product: print.slug }} href={`/product/${print.slug}`}>
                <PrintCard product={print} sizes="(max-width: 768px) 50vw, 33vw" />
              </TrackedLink>
            ))}
          </div>
        </div>
      )}

      {relatedArticles.length > 0 && (
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl text-neutral-900 mb-8">More Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map(ra => (
              <Link key={ra.id} href={`/article/${ra.slug}`} className="group">
                {ra.image && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50 rounded mb-3">
                    <Image
                      src={ra.image}
                      alt={ra.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 256px"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                )}
                <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">{ra.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

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
            datePublished: article.created_time,
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
