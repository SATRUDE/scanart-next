// The Inspire wall: styled room scenes from the socialagent mockup studio,
// each linking to the print(s) it features. Images live on the public Blob
// store (allow-listed in next.config); slugs are resolved against the live
// catalogue at render, so a retired print quietly drops its scene.
// Curated by hand — add a scene by rehosting the image in socialagent
// (/api/rehost) and appending here with its real pixel dimensions.

export interface InspireScene {
  image: string;
  alt: string;
  /** Product slugs featured in the scene, in display order. */
  slugs: string[];
  width: number;
  height: number;
}

export const inspireScenes: InspireScene[] = [
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/scratch_test_2026-08-05-1785921492911-png-1786004464723.png',
    alt: 'Hyttefrokost by Sia Siamos framed in oak on a warm white wall, above a cane chair under a paper pendant',
    slugs: ['hyttefrokost'],
    width: 848,
    height: 1264,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/image__6__2x_upscaled_1784623863100-png-1786004467097.png',
    alt: 'Hyttefrokost hanging on a pale green wall beside a chrome cantilever chair',
    slugs: ['hyttefrokost'],
    width: 1144,
    height: 1704,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/image__7__2x_upscaled_1784624339256-png-1786004468287.png',
    alt: 'Hummer og Vin leaning on a dark desk beside a white arch sculpture',
    slugs: ['hummer-og-vin'],
    width: 2048,
    height: 2048,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/scratch_test_2026-07-20-1784579791165_2x_upscaled_1784629394218-png-1786004469245.png',
    alt: 'Mean Snothing framed on a grey tray table with a patterned ceramic bowl',
    slugs: ['mean-snothing'],
    width: 1856,
    height: 2262,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_crop_2026-07-20-1784574937600-png-1786004470422.png',
    alt: 'Half Man on a green sideboard in a warm yellow kitchen corner',
    slugs: ['half-man'],
    width: 830,
    height: 888,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_edit_2026-07-21-1784638871802-png-1786004472065.png',
    alt: 'Birdie Pink above a bed with yellow striped bedding and a green glass lamp',
    slugs: ['birdie-pink'],
    width: 585,
    height: 838,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/scratch_test_2026-07-21-1784636521045-png-1786004472636.png',
    alt: 'Birdie Green on a pale blue bedroom wall above a light oak bed',
    slugs: ['birdie-green'],
    width: 565,
    height: 850,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_edit_2026-07-21-1784634836712_2x_upscaled_1784634908121-png-1786004473570.png',
    alt: 'Birdie Brown leaning on a dark desk beside a white ribbed vase',
    slugs: ['birdie-brown'],
    width: 2048,
    height: 2048,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_edit_2026-07-21-1784630574828_2x_upscaled_1784630761505-png-1786004475008.png',
    alt: 'Birdie Blue over a light wood dining table in a soft blue room',
    slugs: ['birdie-blue'],
    width: 1526,
    height: 1256,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_edit_2026-07-21-1784629946925_2x_upscaled_1784629986443-png-1786004476087.png',
    alt: 'Birdie Green on a sage wall beside a cane cantilever chair',
    slugs: ['birdie-green'],
    width: 1052,
    height: 1870,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_edit_2026-08-05-1785932268916_2x_upscaled_1785932963707-png-1786004477027.png',
    alt: 'Vinkveld above a cobalt side table and an oxblood chair, lit by a cone pendant',
    slugs: ['vinkveld'],
    width: 1150,
    height: 1704,
  },
  {
    image: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/mockup_edit_2026-08-05-1785939267068-png-1786004478138.png',
    alt: 'Eye Nose Eye leaning on an olive green sideboard filled with books',
    slugs: ['eye-nose-eye'],
    width: 928,
    height: 1152,
  },
];
