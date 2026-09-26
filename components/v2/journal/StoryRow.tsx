import { TrackedLink } from '@/components/TrackedLink';
import { Hairline, Meta } from '@/components/v2/ui';
import type { ArticleLanguageNote } from '@/lib/article-language';

/**
 * Story row (Figma 238:3837): a text-only story in a ruled list, the Journal
 * "More to read" and the books-series hub. Desktop: category (147 wide, in
 * text-accent), the title in H3, the date on the right. Mobile: category and
 * date on one caption line above the title in Body. The whole row is the
 * link, and its title is the anchor text, which is the point for search: the
 * list links every story by its full headline.
 */
export function StoryRow({
  href,
  title,
  category,
  date,
  note,
  excerpt,
  as: Heading = 'h3',
  event,
  eventData,
  languageNote,
}: {
  href: string;
  title: string;
  category?: string;
  date?: string;
  /** A short note after the title, e.g. "(start here)" on the books-series pillar. */
  note?: string;
  /** The article's excerpt in Small under the title ("More to read"), so the
   *  rows carry each piece's description in the HTML as the old cards did. */
  excerpt?: string;
  as?: 'h3' | 'h4';
  /** Umami event for the click (TrackedLink). */
  event: string;
  eventData?: Record<string, unknown>;
  /** On a Norwegian page: the article is in English, shown after the date. */
  languageNote?: ArticleLanguageNote;
}) {
  return (
    <li className="border-t border-ink first:border-t-0 tab:first:border-t">
      <TrackedLink
        href={href}
        hrefLang={languageNote?.lang}
        event={event}
        eventData={eventData}
        className="group grid grid-cols-[auto_auto_1fr] items-center gap-x-[6px] gap-y-1 py-[14px] tab:grid-cols-[147px_minmax(0,1fr)_auto] tab:items-baseline tab:gap-x-8 tab:py-5"
      >
        {/* One element per field, placed by the grid: category — date over
            the title on mobile, category | title | date across on desktop. */}
        <p className="type-caption text-text-accent">{category}</p>
        {category && date ? <Hairline className="tab:hidden" /> : <span className="tab:hidden" />}
        {date || languageNote ? (
          <p className="whitespace-nowrap type-caption tab:col-start-3 tab:row-start-1">
            {languageNote ? <Meta items={[date, languageNote.label]} /> : date}
          </p>
        ) : (
          <span className="tab:hidden" />
        )}
        <Heading lang={languageNote?.lang} className="col-span-3 row-start-2 min-w-0 type-body transition-colors group-hover:text-brand tab:col-span-1 tab:col-start-2 tab:row-start-1 tab:type-h3">
          {title}
          {note && <span className="type-small tab:ml-3"> {note}</span>}
        </Heading>
        {excerpt && (
          <p lang={languageNote?.lang} className="col-span-3 row-start-3 type-small tab:col-span-1 tab:col-start-2 tab:row-start-2 tab:max-w-[624px]">{excerpt}</p>
        )}
      </TrackedLink>
    </li>
  );
}
