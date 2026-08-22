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

export function validate(
  input: Partial<ArtistApplication>,
  m: ValidationMessages = EN_MESSAGES,
): Errors {
  const e: Errors = {};
  const need = (k: 'name' | 'basedIn' | 'styleNote' | 'whyFit') => {
    const label = m.labels[k];
    const v = (input[k] ?? '').trim();
    if (!v) e[k] = m.isRequired(label);
    else if (v.length > MAX[k]) e[k] = m.tooLong(label, MAX[k]);
  };
  need('name');
  need('basedIn');
  need('styleNote');
  need('whyFit');

  const email = (input.email ?? '').trim();
  if (!email) e.email = m.emailRequired;
  else if (!EMAIL.test(email) || email.length > MAX.email) e.email = m.emailInvalid;

  // One of the two is enough: `links` is what a reviewer actually clicks.
  const site = (input.website ?? '').trim();
  const insta = (input.instagram ?? '').trim();
  if (!site && !insta) e.links = m.linksRequired;
  else if (site.length > MAX.url || insta.length > MAX.url) e.links = m.linkTooLong;

  if (!input.offering || !(OFFERINGS as readonly string[]).includes(input.offering)) {
    e.offering = m.offeringRequired;
  }
  return e;
}

/** The shape of the apply-page copy, in either language. */
export type ApplyCopy = {
  h1: string; intro: string; intro2: string; onlyRoute: string;
  offeringLegend: string; aboutYou: string; linksLegend: string; linksHint: string;
  required: string; optional: string; keepOnFile: string; privacy: string;
  submit: string; submitting: string; thanksHeading: string; thanksBody: string;
  errorSummary: string; sendFailed: string;
  offeringLabels: Record<Offering, string>;
  recommendedHint: string;
  fieldLabels: { name: string; basedIn: string; styleNote: string; whyFit: string; email: string; website: string; instagram: string };
};

/** Validation wording, so the Norwegian form can report in Norwegian while
 *  the API keeps reporting in English.
 *
 *  These stay OUT of ApplyCopy because they hold functions, and ApplyCopy
 *  crosses the server/client boundary as props. The form picks its set from
 *  MESSAGES by locale instead; the build catches it if that ever regresses. */
export interface ValidationMessages {
  isRequired: (label: string) => string;
  tooLong: (label: string, max: number) => string;
  emailRequired: string;
  emailInvalid: string;
  linksRequired: string;
  linkTooLong: string;
  offeringRequired: string;
  labels: { name: string; basedIn: string; styleNote: string; whyFit: string };
}

export const EN_MESSAGES: ValidationMessages = {
  isRequired: label => `${label} is required.`,
  tooLong: (label, max) => `${label} is a little long, ${max} characters at most.`,
  emailRequired: 'An email address is required, since it is how we reply.',
  emailInvalid: 'That does not look like an email address.',
  linksRequired: 'Give us at least one place to see your work.',
  linkTooLong: 'That link is too long.',
  offeringRequired: 'Let us know what you are asking for.',
  labels: {
    name: 'Your name',
    basedIn: 'Where you are based',
    styleNote: 'A note on your work',
    whyFit: 'Why you think it fits',
  },
};

export const NO_MESSAGES: ValidationMessages = {
  isRequired: label => `${label} må fylles ut.`,
  tooLong: (label, max) => `${label} er i overkant langt, maks ${max} tegn.`,
  emailRequired: 'En e-postadresse må fylles ut, siden det er slik vi svarer.',
  emailInvalid: 'Det ser ikke ut som en e-postadresse.',
  linksRequired: 'Gi oss minst ett sted vi kan se arbeidet ditt.',
  linkTooLong: 'Den lenken er for lang.',
  offeringRequired: 'Si oss hva du spør om.',
  labels: {
    name: 'Navnet ditt',
    basedIn: 'Hvor du holder til',
    styleNote: 'Litt om arbeidet ditt',
    whyFit: 'Hvorfor du tror det passer',
  },
};

export const MESSAGES: Record<'en' | 'no', ValidationMessages> = {
  en: EN_MESSAGES,
  no: NO_MESSAGES,
};

export const COPY = {
  h1: 'Show us your work',
  intro:
    'We are a small gallery: a handful of illustrators and printmakers working across Norway and Sweden. We read everything that comes in and we take on very few.',
  // Deliberately does NOT promise a reply. Whether we reply to every applicant
  // is still an open decision on Mark's desk, and a page is a bad place to
  // make a commitment nobody has agreed to.
  intro2:
    'If you make prints and think yours would sit well beside what is already here, tell us about them. It takes a few minutes and a person reads every one.',
  // Removed 2026-08-21 on Mark's call: the section sent an applicant away to
  // read two other pages before they had started, which is the wrong thing to
  // do to someone who has already decided to apply.
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
