import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { Button, Hairline, SectionHeader, TextLink } from '@/components/v2/ui';
import { SmartImage } from '@/components/SmartImage';
import { TrackedLink } from '@/components/TrackedLink';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { getArtistInitials } from '@/data/artists';
import { secondaryFirstImageAlt } from '@/lib/product-image-alt';
import type { CrossLinksStrings } from '@/lib/i18n';
import type { HomeData, HomeStrings } from '@/lib/home';
import { HOME_QUESTIONS } from '@/lib/home';
import { Price } from './Price';
import { StartFromYourWall } from './StartFromYourWall';

type Locale = 'en' | 'no';

interface HomePageProps {
  locale: Locale;
  strings: HomeStrings;
  data: HomeData;
  /** Help groups (data/help.ts or no.help.groups); the four questions are picked from them. */
  help: { items: { q: string; a: string }[] }[];
  /** Per-artist location in the page's language (no.artists on /no). */
  artistLocations?: Record<string, string>;
  crossLinks?: CrossLinksStrings;
}

// The hero row's rhythm (Figma 30:222 desktop, 184:1486 mobile), repeating:
// 3, 2, 6 and about 3.5 columns sharing a bottom edge, so the fourth runs off
// the right edge and the row reads as a carousel (layout.md rule 5). On mobile
// every image is 4:5.
const HERO_TILES = [
  'w-[220px] aspect-[4/5] tab:w-[240px] desk:w-[296px]',
  'w-[150px] aspect-[4/5] tab:w-[160px] desk:w-[187px]',
  'w-[260px] aspect-[4/5] tab:w-[420px] tab:aspect-[6/5] desk:w-[624px]',
  'w-[200px] aspect-[4/5] tab:w-[300px] desk:w-[352px]',
];

// New prints and Journal: equal columns, each image at its own ratio, never
// three the same (layout.md rule 13): 2:3, 1:1, 4:5 and 4:5, 2:3, 1:1.
const PRINT_RATIOS = ['aspect-[2/3]', 'aspect-square', 'aspect-[4/5]'];
const STORY_RATIOS = ['tab:aspect-[4/5]', 'tab:aspect-[2/3]', 'tab:aspect-square'];

// The row starts on the page margin and runs to the viewport's right edge,
// also when the viewport is wider than the 1440 frame.
const BLEED_LEFT = { paddingLeft: 'max(var(--sa-margin), calc((100vw - 1440px) / 2 + var(--sa-margin)))' };
const BLEED_RIGHT_DESK = 'desk:mr-[calc(-1_*_max(var(--sa-margin),_calc((100vw_-_1440px)_/_2_+_var(--sa-margin))))]';

/** The toned portrait the artist hub uses, where one has been made. */
function portraitFor(slug: string, image: string): string | null {
  const toned = `/images/artists/${slug}-tone.webp`;
  if (fs.existsSync(path.join(process.cwd(), 'public', toned))) return toned;
  return image || null;
}

/**
 * The V2 homepage body, shared by / and /no so the two cannot drift. Server
 * rendered throughout; the client leaves are the prices (the visitor's
 * currency) and Start from your wall.
 */
export function HomePage({ locale, strings: t, data, help, artistLocations = {}, crossLinks }: HomePageProps) {
  const p = locale === 'no' ? '/no' : '';
  const ev = (section: string, target: string) => ({ section, target, ...(locale === 'no' ? { locale } : {}) });

  return (
    <div className="pb-section">
      {/* Hero: the headline, its actions 32 below, then the row of rooms. */}
      <section className="pt-10 tab:pt-band">
        <div className="page-x">
          <h1 className="type-display tab:max-w-[635px] desk:!text-[60px] desk:!leading-[80px]">{t.heading}</h1>
          <div className="mt-group flex items-center gap-group desk:mt-8">
            <Button href={`${p}/products`}>{t.seePrints}</Button>
            <TextLink href={`${p}/artists`} arrow={false} size="body" className="tab:type-label">{t.meetArtists}</TextLink>
          </div>
        </div>
        <div
          role="region"
          aria-label={t.carouselLabel}
          tabIndex={0}
          className="scrollbar-hide mt-10 overflow-x-auto overscroll-x-contain tab:mt-band"
          style={BLEED_LEFT}
        >
          <ul className="flex w-max items-end gap-gutter pr-margin">
            {data.hero.map(({ product }, i) => (
              <li key={product.slug} className="flex flex-col gap-tight">
                <TrackedLink
                  href={`${p}/product/${product.slug}`}
                  event="homepage-section-click"
                  eventData={ev('hero', product.slug)}
                  className="group flex flex-col gap-tight"
                >
                  <div className={`${HERO_TILES[i % HERO_TILES.length]} overflow-hidden bg-image-bg`}>
                    {/* useSecondary: the room scene is what is on screen, so
                        the alt describes that rather than the bare print. */}
                    <SmartImage
                      src={product.image}
                      secondarySrc={product.secondaryImage}
                      useSecondary
                      alt={secondaryFirstImageAlt(product, locale)}
                      priority={i === 0}
                      sizes="(max-width: 833px) 260px, (max-width: 1199px) 420px, 624px"
                      className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                    />
                  </div>
                  <div className="type-caption">
                    <p className="flex items-center gap-[6px] whitespace-nowrap">
                      <span>{product.name}</span>
                      <Hairline className="tab:hidden" />
                      <span className="tab:hidden">{product.artist || product.brand}</span>
                    </p>
                    <p className="hidden items-center gap-[6px] whitespace-nowrap tab:flex">
                      <span>{product.artist || product.brand}</span>
                      <Hairline />
                      <span><Price product={product} /></span>
                    </p>
                  </div>
                </TrackedLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* New prints */}
      <section aria-labelledby="new-prints" className="page-x mt-section">
        <SectionHeader id="new-prints" title={t.newPrints.heading} link={{ href: `${p}/products`, label: t.newPrints.link }} />
        <ul className="mt-6 grid grid-cols-1 items-start gap-x-gutter gap-y-10 tab:mt-band tab:grid-cols-3">
          {data.newPrints.map(({ product }, i) => (
            <li key={product.slug}>
              <TrackedLink href={`${p}/product/${product.slug}`} event="homepage-section-click" eventData={ev('new-prints', product.slug)} className="group flex flex-col gap-tight">
                <div className={`${PRINT_RATIOS[i % 3]} w-full overflow-hidden bg-image-bg`}>
                  <SmartImage
                    src={product.image}
                    secondarySrc={product.secondaryImage}
                    useSecondary
                    alt={secondaryFirstImageAlt(product, locale)}
                    sizes="(max-width: 833px) 100vw, 33vw"
                    className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                  />
                </div>
                <div>
                  <div className="flex items-start justify-between gap-4 type-body">
                    <h3 className="type-body">{product.name}</h3>
                    <p className="shrink-0"><Price product={product} /></p>
                  </div>
                  <p className="flex items-center gap-[6px] type-small tab:type-caption">
                    <span>{product.artist || product.brand}</span>
                    <Hairline />
                    <span>{Object.keys(product.prices)[0]?.replace(/^(\d+)x(\d+)cm$/i, '$1 × $2 cm')}</span>
                  </p>
                </div>
              </TrackedLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Start from your wall */}
      {data.wallPrints.length > 0 && (
        <section aria-labelledby="start-from-your-wall" className="page-x mt-section">
          <SectionHeader id="start-from-your-wall" title={t.wall.heading} link={{ href: `${p}/inspire`, label: t.wall.inspire }} />
          <div className="mt-6 tab:mt-band">
            <StartFromYourWall prints={data.wallPrints} strings={t.wall} locale={locale} />
          </div>
        </section>
      )}

      {/* How the shop works: heading on 4 columns, the index on 8 (1 + 3 + 4). */}
      <section aria-labelledby="how-the-shop-works" className="page-x page-grid mt-section gap-y-6">
        <div className="col-span-full flex flex-col gap-4 border-t border-ink pt-4 tab:pt-6 desk:col-span-4">
          <h2 id="how-the-shop-works" className="type-h2">{t.howItWorks.heading}</h2>
          <p className="type-small tab:max-w-[405px]">
            {t.howItWorks.wallArtBefore}
            <TrackedLink
              href={`${p}/scandinavian-wall-art`}
              event="homepage-section-click"
              eventData={ev('how-the-shop-works-copy', `${p}/scandinavian-wall-art`)}
              className="text-text-accent transition-colors hover:text-ink"
            >
              {t.howItWorks.wallArtLink}
            </TrackedLink>
            {t.howItWorks.wallArtAfter}
          </p>
        </div>
        <ol className="col-span-full desk:col-span-8">
          {t.howItWorks.rows.map((row, i) => (
            <li key={row.title} className="flex flex-col gap-2 border-t border-ink pt-4 pb-6 tab:grid tab:grid-cols-8 tab:gap-x-gutter tab:pt-6 tab:pb-band">
              <p aria-hidden className="type-h3 text-text-accent tab:col-span-1">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="type-h3 tab:col-span-3">{row.title}</h3>
              <p className="type-body tab:col-span-4">{row.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Statement · nature: the page's one full-bleed block. */}
      <figure className="relative mt-section flex h-[520px] bg-[#47431d] flex-col justify-between overflow-hidden px-margin py-8 text-inverse-text tab:h-[560px] tab:py-margin">
        <Image src="/images/v2/home/statement-moss.jpg" alt="" fill sizes="100vw" className="object-cover" />
        {/* The band's tint was measured for the desktop crop. On the mobile
            crop the 15 px attribution fell to about 3.7:1 at its worst pixel,
            so the scrim colour fades in behind it there, and only there. */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-scrim to-transparent tab:hidden" />
        <blockquote className="relative mx-auto w-full max-w-[1280px]">
          <p className="type-h1 tab:max-w-[843px]">{t.statement.quote}</p>
        </blockquote>
        <figcaption className="relative mx-auto w-full max-w-[1280px] type-small tab:type-caption">
          {t.statement.name}, {t.statement.location}
        </figcaption>
      </figure>

      {/* The artists: heading on 4 columns, the cards from column 5 off the right edge. */}
      <section aria-labelledby="the-artists" className="page-x page-grid mt-section gap-y-6">
        <div className="col-span-full flex items-baseline justify-between gap-6 border-t border-ink pt-4 tab:pt-6 desk:col-span-4 desk:flex-col desk:items-start desk:justify-between">
          <h2 id="the-artists" className="type-h2">{t.artists.heading}</h2>
          <TextLink href={`${p}/artists`} arrow={false} className="shrink-0 tab:type-label">{t.artists.all}</TextLink>
        </div>
        <div className={`col-span-full -mx-margin desk:col-span-8 desk:ml-0 ${BLEED_RIGHT_DESK}`}>
          <div className="scrollbar-hide overflow-x-auto overscroll-x-contain">
            <ul className="flex w-max gap-gutter px-margin desk:pl-0">
              {data.artists.map(a => {
                const photo = portraitFor(a.slug, a.image);
                const city = (artistLocations[a.slug] ?? a.location).split(',')[0];
                return (
                  <li key={a.slug} className="w-[240px] border-t border-ink tab:w-[300px] desk:w-[405px]">
                    <TrackedLink href={`${p}/artist/${a.slug}`} event="homepage-section-click" eventData={ev('the-artists', a.slug)} className="group flex h-full flex-col justify-between gap-group pt-4 desk:h-[380px] desk:pt-6">
                      <div className="flex flex-col gap-3 desk:gap-group">
                        <div className="relative size-12 overflow-hidden bg-image-bg desk:size-14">
                          {photo ? (
                            <Image src={photo} alt={a.name} fill sizes="56px" className="object-cover" />
                          ) : (
                            <span aria-hidden className="flex h-full w-full items-center justify-center border border-ink bg-bg font-serif text-[22px]">{getArtistInitials(a.name)}</span>
                          )}
                        </div>
                        <h3 className="type-h3 transition-colors group-hover:text-brand">{a.name}</h3>
                        <p className="type-small desk:type-body">{t.artists.lines[a.slug]}</p>
                      </div>
                      <p className="flex items-center gap-[6px] type-caption">
                        <span>{city}</span>
                        <Hairline />
                        <span>{a.printCount} {a.printCount === 1 ? t.artists.printOne : t.artists.printOther}</span>
                      </p>
                    </TrackedLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Journal: featured first. Articles are English in phase one, so the
          cards link to the English article pages from /no too. */}
      {data.articles.length > 0 && (
        <section aria-labelledby="journal" className="page-x mt-section">
          <SectionHeader id="journal" title={t.journal.heading} link={{ href: `${p}/journal`, label: t.journal.all }} />
          <div className="-mx-margin mt-6 overflow-x-auto overscroll-x-contain scrollbar-hide tab:mx-0 tab:mt-band tab:overflow-visible">
            <ul className="flex w-max items-start gap-gutter px-margin tab:grid tab:w-full tab:grid-cols-3 tab:px-0">
              {data.articles.map((article, i) => (
                <li key={article.id} className="w-[260px] tab:w-auto">
                  <TrackedLink href={`/article/${article.slug}`} event="homepage-section-click" eventData={ev('journal', article.slug)} className="group flex flex-col gap-tight">
                    {article.image && (
                      <div className={`relative aspect-[4/5] w-full overflow-hidden bg-image-bg ${STORY_RATIOS[i % 3]}`}>
                        <Image
                          src={article.image}
                          alt={article.imageAlt || article.title}
                          fill
                          sizes="(max-width: 833px) 260px, 33vw"
                          style={article.image.includes('-room-') ? { objectPosition: 'center top' } : undefined}
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      {article.category && (
                        <p className="type-caption text-text-accent">{t.journal.categoryLabels?.[article.category] ?? article.category}</p>
                      )}
                      <h3 className="type-body transition-colors group-hover:text-brand">{article.title}</h3>
                    </div>
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Questions: heading and link on 4 columns, the numbered rows on 8. The
          answers are in the HTML (native <details>), open or closed. */}
      <section aria-labelledby="questions" className="page-x mt-section grid grid-cols-1 desk:grid-cols-12 desk:grid-rows-[auto_1fr] desk:gap-x-gutter">
        <div className="border-t border-ink pt-4 tab:pt-6 desk:col-span-4 desk:col-start-1 desk:row-start-1">
          <h2 id="questions" className="type-h2">{t.questions.heading}</h2>
        </div>
        <div className="mt-6 border-b border-ink tab:mt-band desk:col-span-8 desk:col-start-5 desk:row-span-2 desk:row-start-1 desk:mt-0">
          {HOME_QUESTIONS.map(([g, j], i) => {
            const item = help[g]?.items[j];
            if (!item) return null;
            return (
              <details key={item.q} open={i === 0} className="group/q border-t border-line desk:border-ink">
                <summary className="flex cursor-pointer list-none items-start gap-4 py-4 desk:gap-gutter desk:py-6 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="hidden w-[77px] shrink-0 type-h3 text-text-accent desk:block">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="flex-1 type-body desk:type-h3">{item.q}</h3>
                  <span aria-hidden className="type-body desk:type-h3">
                    <span className="group-open/q:hidden">+</span>
                    <span className="hidden group-open/q:inline">−</span>
                  </span>
                </summary>
                <div className="pb-6 type-body tab:max-w-[624px] desk:max-w-[624px] desk:pb-band desk:pl-[109px]">{item.a}</div>
              </details>
            );
          })}
        </div>
        <div className="mt-6 desk:col-span-4 desk:col-start-1 desk:row-start-2 desk:mt-6 desk:self-start">
          <TextLink href={`${p}/help`} arrow={false} size="body" className="desk:type-label">{t.questions.all}</TextLink>
        </div>
      </section>

      {/* Are you an artist? The CTA: headline on 6 columns, body and one button on 5. */}
      <section aria-labelledby="are-you-an-artist" className="page-x mt-section">
        <div className="page-grid gap-y-6 border-t border-ink pt-4 tab:pt-6">
          <h2 id="are-you-an-artist" className="col-span-full type-h2 desk:col-span-6 desk:type-h1">{t.apply.heading}</h2>
          <div className="col-span-full flex flex-col items-start gap-group desk:col-span-5 desk:col-start-7">
            <p className="type-body">{t.apply.body}</p>
            <Button href={`${p}/artists/apply`}>{t.apply.cta}</Button>
          </div>
        </div>
      </section>

      {/* Explore the shop: the category, collection and landing links the old
          homepage carried (docs/v2-seo.md item 3), before the footer. */}
      <div className="page-x mt-section">
        <LandingCrossLinks
          locale={locale}
          strings={crossLinks}
          artists={data.artists.map(a => ({ slug: a.slug, name: a.name }))}
        />
      </div>
    </div>
  );
}
