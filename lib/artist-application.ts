// The artist application form: what it asks and what counts as a valid answer.
//
// Design: Stan's proposal of 2026-08-21 (SA Figma piJ5xF6B7TKN9OqgxlaQkT,
// frames 284:210 / 288:223 / 289:236 / 290:249), layout adapted from the
// Aneo/Joulia enquiry form on Mark's steer that the reference is LAYOUT ONLY
// and the skin is ScanArt's.
//
// Pure and side-effect free, so the validation is testable without a browser
// or a database.

/**
 * The fields mirror socialagent's `ScoutedArtist` (name, basedIn, styleNote,
 * whyFit, links) so an application lands in a shape the Talent page can
 * already read, beside Viggo's outbound finds, rather than in a second inbox.
 */
export interface ArtistApplication {
  name: string;
  basedIn: string;
  styleNote: string;
  whyFit: string;
  email: string;
  website?: string;
  instagram?: string;
  /** What they are asking for. No default: see OFFERINGS. */
  offering: Offering;
  /** Keep me on file if it is not a fit now. Sets ScoutedArtist WAITING. */
  keepOnFile: boolean;
}

export const OFFERINGS = ['Prints', 'Commission', 'Unsure'] as const;
export type Offering = (typeof OFFERINGS)[number];

export const OFFERING_LABEL: Record<Offering, string> = {
  Prints: 'To sell prints through the gallery',
  Commission: 'A commission or a collaboration',
  Unsure: 'Not sure yet',
};

/**
 * Deliberately NO pre-selected option, against the reference form, which
 * pre-selects its recommendation. "Not sure yet" is an answer we actually want,
 * and a default would inflate one option and make the triage worthless.
 */
export const RECOMMENDED_HINT = 'Prints are most of what we do';

export const MAX = {
  name: 120,
  basedIn: 120,
  styleNote: 600,
  whyFit: 600,
  email: 200,
  url: 300,
} as const;

export type FieldName = keyof typeof MAX | 'links' | 'offering';

/** A friendly, specific message per field. Errors attach to the field, except
 *  the links pair, whose requirement is "one of two" and so belongs on the
 *  fieldset rather than on an arbitrary one of them. */
export type Errors = Partial<Record<FieldName, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate(input: Partial<ArtistApplication>): Errors {
  const e: Errors = {};
  const need = (k: 'name' | 'basedIn' | 'styleNote' | 'whyFit', label: string) => {
    const v = (input[k] ?? '').trim();
    if (!v) e[k] = `${label} is required.`;
    else if (v.length > MAX[k]) e[k] = `${label} is a little long, ${MAX[k]} characters at most.`;
  };
  need('name', 'Your name');
  need('basedIn', 'Where you are based');
  need('styleNote', 'A note on your work');
  need('whyFit', 'Why you think it fits');

  const email = (input.email ?? '').trim();
  if (!email) e.email = 'An email address is required, since it is how we reply.';
  else if (!EMAIL.test(email) || email.length > MAX.email) e.email = 'That does not look like an email address.';

  // One of the two is enough: `links` is what a reviewer actually clicks.
  const site = (input.website ?? '').trim();
  const insta = (input.instagram ?? '').trim();
  if (!site && !insta) e.links = 'Give us at least one place to see your work.';
  else if (site.length > MAX.url || insta.length > MAX.url) e.links = 'That link is too long.';

  if (!input.offering || !(OFFERINGS as readonly string[]).includes(input.offering)) {
    e.offering = 'Let us know what you are asking for.';
  }
  return e;
}

export const COPY = {
  h1: 'Show us your work',
  intro:
    'We are a small gallery: a handful of illustrators and printmakers working across Norway and Sweden. We read everything that comes in and we take on very few.',
  // Deliberately does NOT promise a reply. Whether we reply to every applicant
  // is still an open decision on Mark's desk, and a page is a bad place to
  // make a commitment nobody has agreed to.
  intro2:
    'If you make prints and think yours would sit well beside what is already here, tell us about them. It takes a few minutes and a person reads every one.',
  beforeYouStart: 'Before you start',
  beforeYouStartBody:
    'It is worth a look at who we already show and what the gallery is, so you can judge the fit yourself before spending the time.',
  onlyRoute: 'Applications only come through this form, so there is no need to email separately.',
  offeringLegend: 'What are you asking for?',
  aboutYou: 'About you and your work',
  linksLegend: 'Where can we see your work?',
  linksHint: 'One is enough.',
  required: 'Required',
  optional: 'Optional',
  keepOnFile: 'If it is not a fit now, keep my details and look again later',
  privacy:
    'We use what you send only to consider your work. Nothing goes on a mailing list and nothing is shared.',
  submit: 'Send it over',
  submitting: 'Sending',
  thanksHeading: 'Thank you, that is with us',
  thanksBody:
    'A person will read it. If it is a fit we will be in touch; if it is not, that is not a verdict on the work, just on what this small gallery can carry.',
  errorSummary: 'There is a little more to fill in.',
  sendFailed: 'Something went wrong sending that. Please try again in a moment.',
} as const;
