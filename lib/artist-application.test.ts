import { describe, it, expect } from 'vitest';
import { MAX, validate, type ArtistApplication } from './artist-application';
import { buildLinks, buildWhyFit } from './server/artist-application-store';

const good: ArtistApplication = {
  name: 'Kari Nordmann',
  basedIn: 'Bergen, Norway',
  styleNote: 'Screen prints, flat colour, mostly birds.',
  whyFit: 'Sits beside the Brox pieces without repeating them.',
  email: 'kari@example.com',
  website: 'https://kari.example',
  instagram: '',
  offering: 'Prints',
  keepOnFile: true,
};

describe('validate', () => {
  it('accepts a complete application', () => {
    expect(validate(good)).toEqual({});
  });

  it('requires each of the four written fields, naming the field', () => {
    for (const k of ['name', 'basedIn', 'styleNote', 'whyFit'] as const) {
      const errs = validate({ ...good, [k]: '   ' });
      expect(Object.keys(errs)).toEqual([k]);
    }
  });

  it('requires an email, because it is how we reply', () => {
    expect(validate({ ...good, email: '' }).email).toBeTruthy();
    expect(validate({ ...good, email: 'not-an-email' }).email).toBeTruthy();
  });

  it('treats the two links as ONE requirement, not two', () => {
    // Either alone is fine; the error belongs to the pair, not to a field.
    expect(validate({ ...good, website: 'https://a.example', instagram: '' }).links).toBeUndefined();
    expect(validate({ ...good, website: '', instagram: '@someone' }).links).toBeUndefined();
    const neither = validate({ ...good, website: '', instagram: '' });
    expect(neither.links).toBeTruthy();
    expect(neither).not.toHaveProperty('website');
    expect(neither).not.toHaveProperty('instagram');
  });

  it('requires an offering and rejects one that is not on the list', () => {
    expect(validate({ ...good, offering: undefined }).offering).toBeTruthy();
    expect(validate({ ...good, offering: 'Anything' as never }).offering).toBeTruthy();
  });

  it('rejects an over-long field rather than silently truncating a person’s words', () => {
    expect(validate({ ...good, styleNote: 'x'.repeat(MAX.styleNote + 1) }).styleNote).toBeTruthy();
  });
});

describe('what reaches the store', () => {
  it('puts the email in links, because ScoutedArtist has no email column', () => {
    const links = JSON.parse(buildLinks(good)) as { label: string; url: string }[];
    expect(links.some(l => l.label === 'Email' && l.url === 'mailto:kari@example.com')).toBe(true);
  });

  it('omits a link the applicant did not give rather than storing an empty one', () => {
    const links = JSON.parse(buildLinks(good)) as { label: string }[];
    expect(links.map(l => l.label)).toEqual(['Website', 'Email']);
  });

  it('keeps the offering by folding it into whyFit, since there is no column', () => {
    expect(buildWhyFit(good)).toContain('To sell prints through the gallery');
    expect(buildWhyFit(good)).toContain(good.whyFit);
  });
});
