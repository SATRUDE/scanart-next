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
  eltsjoen: scene('eltsjoen', 'Eltsjøen by Ingunn Dybendal framed in a reading corner with a herringbone floor', true),
  'eye-nose-eye': scene('eye-nose-eye', 'Eye Nose Eye by Simen Wahlqvist framed in a home office', true),
  slingshot: scene('slingshot', 'Slingshot by Simen Wahlqvist framed in a child’s drawing corner', true),
  trysilkaffe: scene('trysilkaffe', 'Trysilkaffe by Ingunn Dybendal framed above a kitchen coffee counter', true),
  'hummer-og-vin': scene('hummer-og-vin', 'Hummer og Vin by Sia Siamos framed above a dining table in a blue room'),
  hyttefrokost: scene('hyttefrokost', 'Hyttefrokost by Sia Siamos framed in a dining room'),
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
  // Markus Naarttijärvi's rooms.
  'through-the-willows': { image: '/images/products/through-the-willows-room-clean-rebuild-45x60-2026-09-28.avif', alt: 'Through the Willows above a black dining table with coffee, flowers, a cream rug and beige curtain.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'pines-under-starlight': { image: '/images/products/pines-under-starlight-room-clean-rebuild-45x60-2026-09-28.avif', alt: 'Pines Under Starlight above a pine bed with green striped bedding, burgundy bedside stool, white lamp and pale woven rug.', width: 1121, height: 1403, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'boathouses-in-winter': { image: '/images/products/winter-yard-night-room-clean-rebuild-45x60-2026-09-28.avif', alt: 'Boathouses in winter above a cream reading chair and peach, navy and green checked rug beside a blue trolley in a sage green room.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'frozen-currents': { image: '/images/products/current-and-foam-room-clean-rebuild-45x60-2026-09-28.avif', alt: 'Frozen currents in a slim oak frame hangs above an olive modular desk and black chair in a softly lit Scandinavian workspace.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'the-road-at-sunset': { image: '/images/products/the-road-at-sunset-room-clean-rebuild-45x60-2026-09-28.avif', alt: 'The Road at Sunset in a slim oak frame hangs above a sage Enfold sideboard beside a coat stand in a sunlit tiled entry.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 45, heightCm: 60 } },
  'sun-over-the-forest': { image: '/images/products/sun-over-the-forest-room-clean-rebuild-60x45-2026-09-28-v2.avif', alt: 'Sun Over the Forest in a slim oak frame above an olive modular sofa and cropped oak coffee table in a warm peach living-room vignette.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 60, heightCm: 45 } },
  'swan-on-still-water': { image: '/images/products/swan-on-still-water-room-clean-rebuild-50x40-2026-09-28.avif', alt: 'Front view of the bedroom with green striped bedding and the swan print', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '40x50cm', widthCm: 50, heightCm: 40 } },
  'morning-cabin-room': { image: '/images/products/morning-cabin-room-room-clean-rebuild-60x45-2026-09-28.avif', alt: 'Morning Cabin Room in a slim oak frame hangs above a checked table set for breakfast in a sunlit Scandinavian dining room.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '45x60cm', widthCm: 60, heightCm: 45 } },
  'path-through-the-trees': { image: '/images/products/path-through-the-trees-room-clean-rebuild-50x40-2026-09-28-v2.avif', alt: 'Path Through the Trees in a slim oak frame above a centred oak lounge chair and reading table, with a cropped bookcase and woven rug in a blue-green room.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '40x50cm', widthCm: 50, heightCm: 40 } },
  'sheep-on-the-track': { image: '/images/products/sheep-on-the-track-room-clean-rebuild-40x50-2026-09-28-v2.avif', alt: 'Sheep on the Track in a slim oak frame above a Scandinavian breakfast table with pears, coffee, ceramics and open shelving beside a kitchen window.', width: 1122, height: 1402, depictedPaperSize: { catalogSize: '40x50cm', widthCm: 40, heightCm: 50 } },
  // Ishtar Bäcklund Dakhil's rooms (branch peggy/ishtar-artist-preview).
  stockholm: { image: '/images/products/stockholm-room.avif', alt: 'Stockholm by Ishtar Bäcklund Dakhil framed on a low black bench against a peach wall', width: 1122, height: 1402 },
  'frukt-och-gront': { image: '/images/products/frukt-och-gront-room.avif', alt: 'Frukt & Grönt by Ishtar Bäcklund Dakhil framed above a dining table in a blue kitchen', width: 1122, height: 1402 },
  'desert-circles': { image: '/images/products/desert-circles-room.avif', alt: 'Desert Circles by Ishtar Bäcklund Dakhil framed above a desk in a peach study', width: 1122, height: 1402 },
  'month-of-may': { image: '/images/products/month-of-may-room.avif', alt: 'Month of May by Ishtar Bäcklund Dakhil framed above a dining table with a vase of lilacs', width: 1122, height: 1402 },
  'flight-over-the-valley': { image: '/images/products/flight-over-the-valley-room.avif', alt: 'Flight Over the Valley by Ishtar Bäcklund Dakhil framed in a reading corner with an oak lounge chair', width: 1054, height: 1492 },
  'creature-among-blue-leaves': { image: '/images/products/creature-among-blue-leaves-room.avif', alt: 'Creature Among Blue Leaves by Ishtar Bäcklund Dakhil framed above a rattan sideboard', width: 1122, height: 1402 },
  'surfer-with-orange-sun': { image: '/images/products/surfer-with-orange-sun-room.avif', alt: 'Surfer with Orange Sun by Ishtar Bäcklund Dakhil framed above a red chair in a blue room', width: 1122, height: 1402 },
  // Emma Iben's room (branch codex/emma-iben-preview, Mark-approved 5 October 2026). Good conversation has none until its vignette is fixed.
  pressure: { image: '/images/products/pressure-vignette-2026-10-05.avif', alt: 'Pressure by Emma Iben in a slim oak frame above a terracotta kitchen counter with an orange coffee maker, a carafe of water and a pot of herbs', width: 1122, height: 1402 },
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
  'modern-scandinavian-art': 'half-man',
  'how-to-choose-wall-art-for-a-scandinavian-interior': 'eltsjoen',
  'best-nordic-art-prints': 'massa-applen',
  'nordic-craft-books-glass-ceramics-textiles': 'vinkveld',
  'the-art-of-choosing-art-comprehensive-guide': 'vinkveld--dining',
  'how-to-style-scandinavian-wall-art-living-room': 'small-house-big-ocean',
  'an-interview-by-nordic-notes': 'trysilkaffe',
  'who-are-scandinavian-art': 'sunday-brunch',
  'norwegian-words-behind-the-prints': 'morgenstrekk',
  'scandinavian-wall-decor-ideas': 'stockholm',
  'scandinavian-abstract-art': 'desert-circles',
  'nordic-botanical-prints': 'hummer-og-vin',
  'scandinavian-illustrators': 'eye-nose-eye',
  'how-to-frame-an-art-print': 'hyttefrokost',
  'complete-guide-choosing-print-sizes': 'hummer-og-vin',
  'art-print-or-poster': 'hummer-og-vin',
  'bedroom-wall-art-ideas': 'rosa-blomster',
  'kitchen-and-dining-wall-art': 'hyttefrokost',
};
