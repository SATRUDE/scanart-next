import type { Metadata } from 'next';
import Link from 'next/link';
import { QualityPromise } from '@/components/QualityPromise';
import { FullWidthImage } from '@/components/FullWidthImage';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian About page: app/about/page.tsx mirrored exactly (same
// components, same classes), with the copy swapped for lib/i18n/no.ts.
const t = no.about;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/about',
    languages: hreflangPair('/about'),
  },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/about', ogLocale: 'nb_NO' }),
};

export default function NorwegianAboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero: full-bleed image darkened for legibility, left-pinned text.
          Adapted from the SPN HeroFull pattern, rebuilt in SA's own tokens. */}
      <section className="mx-auto max-w-[1680px] px-8 pt-8">
        <div className="relative flex items-center overflow-hidden rounded min-h-[60vh] md:min-h-[70vh]">
          {/* full-bleed cover image; this project uses plain <img> (see FullWidthImage), not next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/products/tree-top-peach-scene.avif"
            alt={t.heroImageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* mobile base + desktop left gradient keep white text legible on this light image */}
          <div className="absolute inset-0 bg-black/45 md:bg-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />
          {/* text constrained to the page container so it aligns with the nav and body content */}
          <div className="relative w-full">
            <div className="container mx-auto px-8">
              <div className="max-w-lg py-16 text-white">
                <h1 className="text-3xl md:text-4xl font-normal leading-tight tracking-tight">
                  {t.heroTitle}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-white/90">
                  {t.heroSub}
                </p>
                <Link
                  href="/no/products"
                  className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-gray-900 hover:bg-white/90"
                >
                  {t.heroCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <div className="lg:col-span-1">
              <h2 className="text-3xl text-neutral-900 mb-0">{t.aboutHeading}</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                {t.aboutPara1}
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                {t.aboutPara2}
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                {t.aboutPara3}
              </p>
              <Link href="/no/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                {t.viewAllProducts}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-3xl text-neutral-900 mb-0">{t.artistsHeading}</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                {t.artistsPara1}
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                {t.artistsPara2}
              </p>
              <Link href="/no/journal" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                {t.readTheJournal}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <QualityPromise strings={no.qualityPromise} />
      <FullWidthImage locale="no" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: t.jsonLdName,
            url: `${BASE_URL}/no/about`,
            inLanguage: 'no',
            mainEntity: {
              '@type': 'Organization',
              name: 'Scandinavian Art Gallery',
              url: BASE_URL,
              logo: `${BASE_URL}/images/scandinavian-art-gallery-og.jpg`,
              // the gallery's live profiles, same URLs the Footer links
              sameAs: [
                'https://www.instagram.com/helloscandinavianart/',
                'https://www.facebook.com/people/Scandinavian-Art/61563171855842/',
              ],
            },
          }),
        }}
      />
    </div>
  );
}
