// Curated ChatGPT scenes live outside the synced CMS snapshots so each build
// preserves the latest selection. Original artwork images remain untouched.
export interface DepictedPaperSize {
  /** Catalogue size key, independent of how the paper is oriented in the room. */
  catalogSize: string;
  widthCm: number;
  heightCm: number;
}
export interface DisplayedSceneSize {
  depicted: DepictedPaperSize;
  current: { widthCm: number; heightCm: number };
  sameFormat: boolean;
}
export interface ShopScene { image: string; alt: string; width: number; height: number; depictedPaperSize?: DepictedPaperSize }
const scene = (slug: string, alt: string, fresh = false): ShopScene => ({
  image: `/images/products/${slug}-room-${fresh ? 'chatgpt-' : ''}2026-09-23.avif`,
  alt, width: 1122, height: 1402,
});
export const shopScenes: Record<string, ShopScene> = {
  dancer: scene('dancer', 'Dancer by Helene Brox framed above a sofa in a sunlit reading corner', true),
  dragon: scene('dragon', 'Dragon by Helene Brox framed on a blue dining room wall', true),
  eltsjoen: scene('eltsjoen', 'Eltsjøen by Ingunn Dybendal framed in a reading corner with a herringbone floor', true),
  'eye-nose-eye': scene('eye-nose-eye', 'Eye Nose Eye by Simen Wahlqvist framed in a home office', true),
  slingshot: scene('slingshot', 'Slingshot by Simen Wahlqvist framed in a child’s drawing corner', true),
  trysilkaffe: scene('trysilkaffe', 'Trysilkaffe by Ingunn Dybendal framed above a kitchen coffee counter', true),
  'tree-top-peach': scene('tree-top-peach', 'Tree Top Peach by Helene Brox and Massa Äpplen by Hedvig Wallin framed together above green kitchen cabinets', true),
  'hummer-og-vin': scene('hummer-og-vin', 'Hummer og Vin by Sia Siamos framed above a dining table in a blue room'),
  hyttefrokost: scene('hyttefrokost', 'Hyttefrokost by Sia Siamos framed in a dining room'),
  'swallow-dive': scene('swallow-dive', 'Swallow Dive by Helene Brox framed above a low hallway bench'),
  ithinkithink: scene('ithinkithink', 'I Think I Think by Helene Brox framed in a working corner'),
  'sunday-brunch': scene('sunday-brunch', 'Sunday Brunch by Hedvig Wallin framed in a dining room'),
  'rosa-blomster': scene('rosa-blomster', 'Rosa Blomster by Hedvig Wallin framed in a reading corner'),
  'massa-applen': scene('massa-applen', 'Massa Äpplen by Hedvig Wallin framed above a dining table'),
  'small-house-big-ocean': scene('small-house-big-ocean', 'Small House Big Ocean by Hedvig Wallin framed in a reading corner'),
  // Mark-selected 2026-09-23 room tests. URF! still awaits his review.
  cruise: { image: '/images/products/cruise-room-test25-2026-09-28.avif', alt: 'Cruise by Mikko Saarainen framed above a yellow drawing table in a child’s room', width: 1122, height: 1402 },
  'family-trip': { image: '/images/products/family-trip-room-test47-2026-09-28.avif', alt: 'Family Trip by Mikko Saarainen framed above a bookcase in a child’s drawing room', width: 1122, height: 1402 },
  journey: { image: '/images/products/journey-room-test29-2026-09-28.avif', alt: 'Journey by Mikko Saarainen framed above a bed with blue wave bedding', width: 1122, height: 1402 },
  urf: { image: '/images/products/urf-room.avif', alt: 'URF! by Mikko Saarainen framed in a reading corner with a red chair', width: 848, height: 1264 },
  // Codex's scenes of 2026-09-26, kept at their own file names (1122 × 1402).
  vinkveld: { image: '/images/products/vinkveld-room-hallway-2026-09-26.avif', alt: 'Vinkveld by Sia Siamos framed above a bench in a green hallway with terracotta tiles', width: 1122, height: 1402 },
  morgenstrekk: { image: '/images/products/morgenstrekk-room-02-2026-09-26.avif', alt: 'Morgenstrekk by Simen Wahlqvist framed above a bed in a blue bedroom', width: 1122, height: 1402 },
  'half-man': { image: '/images/products/half-man-room-2026-09-26.avif', alt: 'Half Man by Simen Wahlqvist framed above an oak lounge chair in a peach reading corner', width: 1122, height: 1402 },
  // A second scene of a print is keyed "<print>--<name>": articles can use it,
  // and the article page reads the print from the part before "--".
  'vinkveld--dining': { image: '/images/products/vinkveld-room-dining-2026-09-26.avif', alt: 'Vinkveld by Sia Siamos framed above a dining table against a peach wall', width: 1122, height: 1402 },
  // Markus previews: the unpublished products gate these scenes from live display.
  'through-the-willows': { image: '/images/products/through-the-willows-room-matched-45x60-2026-09-28.avif', alt: 'Through the Willows by Markus Naarttijärvi above a black dining table with coffee, flowers, a cream rug and beige curtain', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'pines-under-starlight': { image: '/images/products/pines-under-starlight-room-matched-45x60-2026-09-28.avif', alt: 'Pines Under Starlight by Markus Naarttijärvi: a snow-pine night photograph in an oak frame hangs above a side-on pine bed with green striped bedding, a burgundy bedside stool, cream curtains and a pale woven rug.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'winter-yard-night': { image: '/images/products/winter-yard-night-room-matched-45x60-2026-09-28.avif', alt: 'Winter Yard, Night by Markus Naarttijärvi framed above a cream reading chair on a blue, green and cream checked rug beside a blue trolley in a sage green room', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'current-and-foam': { image: '/images/products/current-and-foam-room-matched-45x60-2026-09-28.avif', alt: 'Current and Foam by Markus Naarttijärvi: an oak-framed abstract foam photograph hangs over a green USM desk, black chair and white task lamp in a sunlit work corner with a flecked rug.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'the-road-at-sunset': { image: '/images/products/the-road-at-sunset-room-matched-45x60-2026-09-28.avif', alt: 'The Road at Sunset by Markus Naarttijärvi: an oak-framed road at sunset hangs above a ribbed green sideboard in a terracotta-tiled entry, beside a coat stand, pine shoe stool and grey rug.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'sun-over-the-forest': { image: '/images/products/sun-over-the-forest-room-matched-60x45-2026-09-28.avif', alt: 'Sun Over the Forest by Markus Naarttijärvi: olive corner sofa, oak coffee table, drinks and a striped throw beneath a sunset photograph on a peach wall.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 60, heightCm: 45 } },
  'swan-on-still-water': { image: '/images/products/swan-on-still-water-room-matched-50x40-2026-09-28.avif', alt: 'Swan on Still Water by Markus Naarttijärvi framed above a green sideboard with flowers and books beside an olive chair', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '40x50cm', widthCm: 50, heightCm: 40 } },
  'morning-cabin-room': { image: '/images/products/morning-cabin-room-room-matched-60x45-2026-09-28.avif', alt: 'Morning, Cabin Room by Markus Naarttijärvi: black-topped birch breakfast table set for two beneath a framed dark cabin and foliage photograph.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 60, heightCm: 45 } },
  'path-through-the-trees': { image: '/images/products/path-through-the-trees-room-matched-50x40-2026-09-28.avif', alt: 'Path Through the Trees by Markus Naarttijärvi in an oak frame above a green corduroy sofa, beside a white side table in a yellow room with right-window daylight.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '40x50cm', widthCm: 50, heightCm: 40 } },
  'sheep-on-the-track': { image: '/images/products/sheep-on-the-track-room-matched-40x50-2026-09-28.avif', alt: 'Sheep on the Track by Markus Naarttijärvi in an oak frame above a writing desk with an open notebook and water glass, beside a sunlit window and peach wall.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '40x50cm', widthCm: 40, heightCm: 50 } },
  // Ishtar Bäcklund Dakhil's seven rooms are held back with her prints until
  // she has approved her prices and content (her agreement is signed);
  // restore them from branch ishtar/preview.
};

/** Only label a room image when it is this scene and its current size is known. */
export function displayedScenePaperSize(
  slug: string,
  roomImageSrc: string | undefined,
  offeredSizes: Record<string, boolean> | undefined
): DisplayedSceneSize | undefined {
  const scene = shopScenes[slug];
  const depicted = scene?.depictedPaperSize;
  if (scene?.image !== roomImageSrc || !depicted) return undefined;
  const offered = Object.entries(offeredSizes ?? {}).filter(([, available]) => available).map(([size]) => size);
  if (offered.includes(depicted.catalogSize)) {
    return { depicted, current: { widthCm: depicted.widthCm, heightCm: depicted.heightCm }, sameFormat: true };
  }
  // With several different offered sizes, a room photo cannot identify which
  // current option it illustrates. The Markus previews each offer one size.
  if (offered.length !== 1) return undefined;
  const dimensions = offered[0].match(/^(\d+)x(\d+)cm$/);
  if (!dimensions) return undefined;
  const short = Math.min(Number(dimensions[1]), Number(dimensions[2]));
  const long = Math.max(Number(dimensions[1]), Number(dimensions[2]));
  const landscape = depicted.widthCm > depicted.heightCm;
  return {
    depicted,
    current: { widthCm: landscape ? long : short, heightCm: landscape ? short : long },
    sameFormat: false,
  };
}

export const articleSceneSlugs: Record<string, string> = {
  // Articles that carried April/August generated rooms now open on the
  // 2026-09-23/26 scenes (Mark, 2026-09-26): the same print where the old
  // image showed one and no other article already uses it.
  'modern-scandinavian-art': 'dragon',
  'how-to-choose-wall-art-for-a-scandinavian-interior': 'eltsjoen',
  'best-nordic-art-prints': 'tree-top-peach',
  'nordic-craft-books-glass-ceramics-textiles': 'vinkveld',
  'the-art-of-choosing-art-comprehensive-guide': 'vinkveld--dining',
  'how-to-style-scandinavian-wall-art-living-room': 'small-house-big-ocean',
  'an-interview-by-nordic-notes': 'trysilkaffe',
  'who-are-scandinavian-art': 'sunday-brunch',
  'norwegian-words-behind-the-prints': 'morgenstrekk',
  'scandinavian-wall-decor-ideas': 'swallow-dive',
  'scandinavian-abstract-art': 'dancer',
  'nordic-botanical-prints': 'hummer-og-vin',
  'scandinavian-illustrators': 'eye-nose-eye',
  'how-to-frame-an-art-print': 'hyttefrokost',
  'complete-guide-choosing-print-sizes': 'hummer-og-vin',
  'art-print-or-poster': 'hummer-og-vin',
  'bedroom-wall-art-ideas': 'rosa-blomster',
  'kitchen-and-dining-wall-art': 'hyttefrokost',
};
