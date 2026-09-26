import type { LegalSection } from '@/components/LegalPage';
import { CREDITS, type CreditGroup, type CreditNote, type Credit } from '@/lib/credits';

interface CreditStrings {
  groups: Record<CreditGroup, string>;
  notes: Record<CreditNote, string>;
  by: string;
  basedOn: string;
  where: (credit: Credit) => string;
}

const GROUPS: CreditGroup[] = ['footer', 'photos'];

/**
 * The credits as Legal page sections, one per group: each entry is the work's
 * title linked to its Commons file page, the author, the licence linked to
 * its deed, what we changed and where it appears. Shared by /credits and
 * /no/credits so the two lists can never drift apart.
 */
export function creditSections(strings: CreditStrings): LegalSection[] {
  return GROUPS.map(group => ({
    id: group,
    heading: strings.groups[group],
    body: (
      <ul>
        {CREDITS.filter(c => c.group === group).map(c => (
          <li key={c.id}>
            <a href={c.source} target="_blank" rel="noopener noreferrer">{c.title}</a>
            {` ${strings.by} ${c.author}${c.basedOn ? `; ${strings.basedOn} ${c.basedOn}` : ''}. `}
            <a href={c.licence.url} target="_blank" rel="noopener noreferrer license">{c.licence.name}</a>
            {`. ${strings.notes[c.note]}. ${strings.where(c)}.`}
          </li>
        ))}
      </ul>
    ),
  }));
}
