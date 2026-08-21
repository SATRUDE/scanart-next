import { neon } from '@neondatabase/serverless';
import type { ArtistApplication } from '@/lib/artist-application';
import { OFFERING_LABEL } from '@/lib/artist-application';

/**
 * Recording an application in the socialagent store, as a `ScoutedArtist` row
 * at status NEW.
 *
 * Mark's call on 2026-08-21: applications should be visible but distinct from
 * Viggo's outbound finds. The distinct VIEW is a socialagent job; what matters
 * here is that the row is shaped so the Talent page can read it beside a
 * scouting find, because the alternative was a second inbox and a second
 * review habit.
 *
 * TWO ZERO-MIGRATION DECISIONS, both reversible, so this can ship before Mark
 * rules on the schema:
 *
 * 1. `ScoutedArtist` has NO email column. Email lives on `Outreach`, which only
 *    exists once a conversation starts. So the address goes into `links` as a
 *    labelled entry, which the Talent page already renders. Stan found this and
 *    it is his suggestion.
 * 2. There is no column for what they are asking for, so the offering is
 *    written into `whyFit` as a first line rather than dropped.
 *
 * If Mark adds `contactEmail` and `offering` later, this function is the only
 * place that changes.
 *
 * `status` is a plain String column with a default of NEW, not a Postgres enum,
 * so it is inserted as text. I had written a `::"ScoutedArtistStatus"` cast
 * first, which would have thrown at runtime against a type that does not
 * exist; reading prisma/schema.prisma rather than assuming caught it. WAITING
 * is documented there as "open door, revisit later", which is exactly what the
 * keep-me-on-file box means.
 *
 * Never throws: an applicant has done their part, and our database having a bad
 * minute must not become an error on their screen or lose the Slack message.
 */
function databaseUrl(): string | undefined {
  return process.env.ARTICLES_DATABASE_URL ?? process.env.DATABASE_URL;
}

export function buildLinks(a: ArtistApplication): string {
  const links: { label: string; url: string }[] = [];
  if (a.website) links.push({ label: 'Website', url: a.website });
  if (a.instagram) links.push({ label: 'Instagram', url: a.instagram });
  links.push({ label: 'Email', url: `mailto:${a.email}` });
  return JSON.stringify(links);
}

export function buildWhyFit(a: ArtistApplication): string {
  return `Asking for: ${OFFERING_LABEL[a.offering]}\n\n${a.whyFit}`;
}

export async function recordApplication(a: ArtistApplication): Promise<void> {
  const url = databaseUrl();
  if (!url) return;
  try {
    const sql = neon(url);
    await sql`
      INSERT INTO "ScoutedArtist"
        ("id", "name", "basedIn", "styleNote", "whyFit", "links", "sourceUrl", "status", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${a.name},
        ${a.basedIn},
        ${a.styleNote},
        ${buildWhyFit(a)},
        ${buildLinks(a)},
        ${'/artists/apply'},
        ${a.keepOnFile ? 'WAITING' : 'NEW'},
        NOW()
      )
    `;
  } catch (error) {
    console.error('[artist-application] could not record the application:', error);
  }
}
