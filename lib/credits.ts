/**
 * Credits for the third-party footage and photographs the site ships, all from
 * Wikimedia Commons under Creative Commons licences that allow commercial use
 * with attribution (Mark, 2026-09-26: they stay at launch, credited at
 * /credits and /no/credits).
 *
 * Every author and licence here was read from the Commons API
 * (prop=imageinfo, extmetadata Artist / LicenseShortName / LicenseUrl) on
 * 2026-09-26, and each shipped file was matched to its source against the
 * originals in brands/scandinavian-art/{seasons/footage-test,nature,textures}.
 * Never add an entry whose author you have not confirmed that way.
 *
 * Public-domain paintings used as journal heroes (Krøyer, Sohlberg,
 * Hammershøi) need no credit and are not listed.
 *
 * English copy lives here; the Norwegian (group headings, notes and the
 * "where" line) is in lib/i18n/no.ts under `credits`, keyed by the same ids.
 */

export type CreditGroup = 'footer' | 'photos';
export type CreditNote = 'croppedLoopedToned' | 'croppedToned' | 'croppedBlurredToned';

export interface Credit {
  id: string;
  group: CreditGroup;
  /** Files under public/ derived from this source. */
  assets: string[];
  /** The Commons file title, without the "File:" prefix and extension. */
  title: string;
  /** Author exactly as the Commons file page credits them. */
  author: string;
  /** A second maker the Commons page credits (the photograph behind the film). */
  basedOn?: string;
  /** The Commons file page. */
  source: string;
  licence: { name: string; url: string };
  note: CreditNote;
  /** Where it appears on the site (English). */
  where: string;
}

const BY_SA_4 = { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' };
const BY_SA_3 = { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' };
const BY_SA_1 = { name: 'CC BY-SA 1.0', url: 'https://creativecommons.org/licenses/by-sa/1.0/' };
const BY_3 = { name: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/' };
const BY_2 = { name: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0/' };

const season = (s: string) => ['av1.mp4', 'h264.mp4', 'poster.jpg'].map(ext => `public/video/seasons/${s}.${ext}`);
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const CREDITS: Credit[] = [
  {
    id: 'winter',
    group: 'footer',
    assets: season('winter'),
    title: 'Snow falling in Tuntorp',
    author: 'W.carter',
    source: commons('Snow_falling_in_Tuntorp.webm'),
    licence: BY_SA_4,
    note: 'croppedLoopedToned',
    where: 'Winter, in the footer wordmark',
  },
  {
    id: 'spring',
    group: 'footer',
    assets: season('spring'),
    title: 'Anemone nemorosa',
    author: 'Sebastian Wallroth',
    source: commons('Anemone_nemorosa.ogv'),
    licence: BY_SA_1,
    note: 'croppedLoopedToned',
    where: 'Spring, in the footer wordmark',
  },
  {
    id: 'summer',
    group: 'footer',
    assets: season('summer'),
    title: 'Groyne and sea waves at Curonian Spit',
    author: 'Alexander Grebenkov',
    source: commons('Groyne_and_sea_waves_at_Curonian_Spit.webm'),
    licence: BY_3,
    note: 'croppedLoopedToned',
    where: 'Summer, in the footer wordmark',
  },
  {
    id: 'autumn',
    group: 'footer',
    assets: season('autumn'),
    title: 'Falling autumn leaves',
    author: 'The Nature Box',
    basedOn: 'saihanul (Seongho Kwon)',
    source: commons('Falling_autumn_leaves.webm'),
    licence: BY_SA_3,
    note: 'croppedLoopedToned',
    where: 'Autumn, in the footer wordmark',
  },
  {
    id: 'moss',
    group: 'photos',
    assets: [
      'public/images/v2/about/statement-moss.webp',
      'public/images/v2/home/statement-moss.jpg',
      'public/images/v2/about/windows/nature-moss.webp',
    ],
    title: 'Hylocomium splendens 1448',
    author: 'Walter Siegmund',
    source: commons('Hylocomium_splendens_1448.JPG'),
    licence: BY_SA_3,
    note: 'croppedBlurredToned',
    where: 'The moss behind the customer quote on the About and home pages, and in the About headline',
  },
  {
    id: 'forest-floor',
    group: 'photos',
    assets: ['public/images/v2/about/windows/nature-forest-floor.webp'],
    title: 'PleuroziumPiceaBorealForest',
    author: 'Richtid',
    source: commons('PleuroziumPiceaBorealForest.JPG'),
    licence: BY_SA_3,
    note: 'croppedToned',
    where: 'Forest floor, in the About headline',
  },
  {
    id: 'sea-ripples',
    group: 'photos',
    assets: ['public/images/v2/about/windows/nature-sea-ripples.webp'],
    title: 'Ripples in the water of Brofjorden',
    author: 'W.carter',
    source: commons('Ripples_in_the_water_of_Brofjorden.jpg'),
    licence: BY_SA_4,
    note: 'croppedToned',
    where: 'Sea ripples, in the About headline',
  },
  {
    id: 'lupins',
    group: 'photos',
    assets: ['public/images/v2/about/windows/nature-lupins.webp'],
    title: 'PermaLiv lupiner morgen 20-06-20',
    author: 'Øyvind Holmstad',
    source: commons('PermaLiv_lupiner_morgen_20-06-20.jpg'),
    licence: BY_SA_4,
    note: 'croppedToned',
    where: 'Lupins, in the About headline',
  },
  {
    id: 'spruce',
    group: 'photos',
    assets: ['public/images/v2/about/windows/nature-forest-spruce.webp'],
    title: 'Swedish Spruce Forest',
    author: 'Nick Lott',
    source: commons('Swedish_Spruce_Forest.jpg'),
    licence: BY_2,
    note: 'croppedToned',
    where: 'Spruce forest, in the About headline',
  },
];

export const creditsEn = {
  meta: {
    title: 'Credits',
    description: 'Credits for the footage and photographs on Scandinavian Art that come from Wikimedia Commons.',
  },
  intro:
    'The footage in the footer wordmark and some of the photographs on the About page come from Wikimedia Commons, shared by their makers under Creative Commons licences. We have adapted each one as noted. Where the licence is Share-Alike, our adapted version is shared under that same licence.',
  groups: { footer: 'Footer film', photos: 'About photographs' } satisfies Record<CreditGroup, string>,
  notes: {
    croppedLoopedToned: 'Cropped, looped and colour-toned',
    croppedToned: 'Cropped and colour-toned',
    croppedBlurredToned: 'Cropped, blurred and colour-toned',
  } satisfies Record<CreditNote, string>,
  by: 'by',
  basedOn: 'background image by',
  lastUpdated: '26 September 2026',
};
