import { NextResponse } from 'next/server';
import { validate, type ArtistApplication } from '@/lib/artist-application';
import { recordApplication } from '@/lib/server/artist-application-store';
import { sendSlackApplication } from '@/lib/server/slack-artist-application';

/**
 * One application, one POST.
 *
 * Validation runs here as well as in the browser, because the browser's copy is
 * a courtesy and this route is public. The same `validate` function does both,
 * so the rules cannot drift.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'not-an-object' }, { status: 400 });
  }

  const input = body as Partial<ArtistApplication>;
  const errors = validate(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const application: ArtistApplication = {
    name: input.name!.trim(),
    basedIn: input.basedIn!.trim(),
    styleNote: input.styleNote!.trim(),
    whyFit: input.whyFit!.trim(),
    email: input.email!.trim(),
    website: input.website?.trim() || undefined,
    instagram: input.instagram?.trim() || undefined,
    offering: input.offering!,
    keepOnFile: Boolean(input.keepOnFile),
  };

  // Both, and neither can fail the other. Slack is how it gets noticed today;
  // the row is how it joins the review queue.
  await Promise.allSettled([sendSlackApplication(application), recordApplication(application)]);

  return NextResponse.json({ ok: true });
}
