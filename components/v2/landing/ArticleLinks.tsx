import { TextLink } from '@/components/v2/ui';

/**
 * Text links to journal articles, for a landing's Content-section footer. The
 * words come in already translated (lib/journal-links.ts). Articles are the one
 * untranslated route, so on /no the link goes to the English article and says
 * so with hrefLang, as CollectionStyling's related-article link does.
 */
export function ArticleLinks({ links, locale }: { links: { slug: string; label: string }[]; locale: 'en' | 'no' }) {
  return (
    <>
      {links.map(link => (
        <TextLink key={link.slug} href={`/article/${link.slug}`} hrefLang={locale === 'no' ? 'en' : undefined}>
          {link.label}
        </TextLink>
      ))}
    </>
  );
}
