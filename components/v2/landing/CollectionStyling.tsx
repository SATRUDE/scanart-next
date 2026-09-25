import Image from 'next/image';
import { ContentSection, ContentBody, ListItem, TextLink } from '@/components/v2/ui';
import { TrackedLink } from '@/components/TrackedLink';

/**
 * A collection landing's styling section and its extras (docs/v2-seo.md,
 * "Collections"): the illustrated tips as image cards where the collection has
 * them, the plain tip list where it doesn't, then the planner link on
 * living-room and the related-article link, both as text links in the Content
 * section's footer. Shared by the English and Norwegian pages so the two can't
 * drift; the words come in already translated.
 */
export function CollectionStyling({
  locale,
  slug,
  heading,
  tips,
  cards,
  plannerLabel,
  relatedArticle,
}: {
  locale: 'en' | 'no';
  slug: string;
  heading: string;
  tips: string[];
  cards?: { label: string; tip: string; image: string; alt: string }[];
  /** Shown on living-room only. The planner is English-only, so both trees link to /gallery-wall-planner. */
  plannerLabel?: string;
  /** Articles are the one untranslated route: /no links out to the English article on purpose. */
  relatedArticle?: { slug: string; label: string };
}) {
  const footer =
    plannerLabel || relatedArticle ? (
      <>
        {plannerLabel && (
          <TrackedLink
            href="/gallery-wall-planner"
            event="gallery-wall-planner-collection-click"
            eventData={{ collection: slug, locale }}
            className="group/link inline-flex items-center gap-2 type-small transition-colors hover:text-brand"
          >
            {/* TextLink's markup, which can't carry the planner's click event. */}
            <span aria-hidden className="-mr-2 h-px w-0 bg-brand transition-[width,margin] duration-200 ease-out group-hover/link:mr-0 group-hover/link:w-3" />
            <span>{plannerLabel}</span>
            <span aria-hidden>→</span>
          </TrackedLink>
        )}
        {relatedArticle && <TextLink href={`/article/${relatedArticle.slug}`}>{relatedArticle.label}</TextLink>}
      </>
    ) : undefined;

  return (
    <ContentSection id="styling" title={heading} className="mt-section" footer={footer}>
      {cards ? (
        <div className="grid gap-10 tab:grid-cols-3 tab:gap-gutter">
          {cards.map(card => (
            <figure key={card.label} className="flex flex-col gap-tight">
              <div className="relative aspect-[4/3] overflow-hidden bg-image-bg">
                <Image src={card.image} alt={card.alt} fill sizes="(max-width: 833px) 100vw, 270px" className="object-cover object-top" />
              </div>
              <figcaption className="flex flex-col gap-1">
                <span className="type-body">{card.label}</span>
                <span className="type-small">{card.tip}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <ContentBody>
          <ul>
            {tips.map(tip => (
              <ListItem key={tip} type="bullet">{tip}</ListItem>
            ))}
          </ul>
        </ContentBody>
      )}
    </ContentSection>
  );
}
