import React from 'react';
import { Hairline, Question } from '@/components/v2/ui';
import type { HelpGroup } from '@/data/help';

/** "Orders & payment" → "orders-payment", the group's anchor. */
export function groupId(category: string): string {
  return category
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9æøå]+/g, '-')
    .replace(/^-|-$/g, '');
}

const EMAIL = 'hello@scandinavianart.co.uk';

/** The answers are plain text (they are the FAQPage JSON-LD too); the address becomes a link on the page only. */
function withEmailLink(text: string): React.ReactNode {
  const parts = text.split(EMAIL);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {i > 0 && <a href={`mailto:${EMAIL}`}>{EMAIL}</a>}
      {part}
    </React.Fragment>
  ));
}

/** The row of jump links under the page header: "— Orders & payment — Shipping & delivery …". */
export function HelpJumpLinks({ groups }: { groups: HelpGroup[] }) {
  return (
    <ul className="-mx-margin mt-6 flex gap-6 overflow-x-auto px-margin scrollbar-hide tab:mx-0 tab:mt-12 tab:flex-wrap tab:overflow-visible tab:px-0">
      {groups.map(group => (
        <li key={group.category} className="shrink-0">
          <a href={`#${groupId(group.category)}`} className="flex items-center gap-tight whitespace-nowrap type-small transition-colors hover:text-brand">
            <Hairline />
            {group.category}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Help questions (Figma: Help · desktop 213:2850, mobile 213:3248): each
 * group's heading and count on 4 columns, its Question rows on the other 8,
 * the first one open.
 *
 * Question is a native <details>, so every answer is in the served HTML.
 * Before V2 the accordion rendered closed panels as nothing at all, and the
 * answers existed only in the FAQPage JSON-LD, which is exactly the mismatch
 * Google's FAQ guidelines rule out (docs/v2-seo.md, item 6).
 */
export function HelpGroups({
  groups,
  countLabel,
}: {
  groups: HelpGroup[];
  /** "{n} questions". */
  countLabel: (n: number) => string;
}) {
  return (
    <div className="flex flex-col gap-band desk:gap-section">
      {groups.map(group => {
        const id = groupId(group.category);
        return (
          <section key={group.category} id={id} aria-labelledby={`${id}-heading`} className="page-grid scroll-mt-8">
            <div className="col-span-full border-t border-ink pt-4 tab:pt-group desk:col-span-4">
              <h2 id={`${id}-heading`} className="type-h2">{group.category}</h2>
              <p className="mt-2 hidden type-caption desk:block">{countLabel(group.items.length)}</p>
            </div>
            <div className="col-span-full mt-2 desk:col-span-8 desk:mt-0 desk:border-t desk:border-ink">
              {group.items.map((item, i) => (
                <Question key={item.q} question={item.q} open={i === 0} className="[&_summary]:items-center">
                  <p>{withEmailLink(item.a)}</p>
                </Question>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
