// Curated ChatGPT scenes live outside the synced CMS snapshots so each build
// preserves the latest selection. Original artwork images remain untouched.
export interface ShopScene { image: string; alt: string; width: number; height: number }
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
  // Mikko Saarainen's rooms (branch add-mikko-saarainen), rendered with the
  // art at its real size, so they keep their own file names and 848 × 1264.
  cruise: { image: '/images/products/cruise-room.avif', alt: 'Cruise by Mikko Saarainen framed above a bed in a child’s bedroom', width: 848, height: 1264 },
  'family-trip': { image: '/images/products/family-trip-room.avif', alt: 'Family Trip by Mikko Saarainen framed in a hallway above a rattan sideboard', width: 848, height: 1264 },
  journey: { image: '/images/products/journey-room.avif', alt: 'Journey by Mikko Saarainen framed above a sofa in a living room', width: 848, height: 1264 },
  urf: { image: '/images/products/urf-room.avif', alt: 'URF! by Mikko Saarainen framed in a reading corner with a red chair', width: 848, height: 1264 },
  // Codex's scenes of 2026-09-26, kept at their own file names (1122 × 1402).
  vinkveld: { image: '/images/products/vinkveld-room-hallway-2026-09-26.avif', alt: 'Vinkveld by Sia Siamos framed above a bench in a green hallway with terracotta tiles', width: 1122, height: 1402 },
  morgenstrekk: { image: '/images/products/morgenstrekk-room-02-2026-09-26.avif', alt: 'Morgenstrekk by Simen Wahlqvist framed above a bed in a blue bedroom', width: 1122, height: 1402 },
  'half-man': { image: '/images/products/half-man-room-2026-09-26.avif', alt: 'Half Man by Simen Wahlqvist framed above an oak lounge chair in a peach reading corner', width: 1122, height: 1402 },
  // A second scene of a print is keyed "<print>--<name>": articles can use it,
  // and the article page reads the print from the part before "--".
  'vinkveld--dining': { image: '/images/products/vinkveld-room-dining-2026-09-26.avif', alt: 'Vinkveld by Sia Siamos framed above a dining table against a peach wall', width: 1122, height: 1402 },
  // Markus previews: the unpublished products gate these scenes from live display.
  'through-the-willows': { image: '/images/products/through-the-willows-room-fresh-02-2026-09-28.avif', alt: 'Through the Willows by Markus Naarttijärvi framed above a black round dining table in a pale yellow room', width: 1122, height: 1402 },
  'pines-under-starlight': { image: '/images/products/pines-under-starlight-room-2026-09-28.avif', alt: 'Pines Under Starlight by Markus Naarttijärvi framed above a black bench in a pale blue hallway', width: 1122, height: 1402 },
  'winter-yard-night': { image: '/images/products/winter-yard-night-room-fresh-03-2026-09-28.avif', alt: 'Winter Yard, Night by Markus Naarttijärvi framed above a cream reading chair beside a blue trolley in a sage green room', width: 1122, height: 1402 },
  'current-and-foam': { image: '/images/products/current-and-foam-room-2026-09-28.avif', alt: 'Current and Foam by Markus Naarttijärvi framed above a black bench in a grey hallway', width: 1122, height: 1402 },
  'the-road-at-sunset': { image: '/images/products/the-road-at-sunset-room-2026-09-28.avif', alt: 'The Road at Sunset by Markus Naarttijärvi framed above a black bench in a sunlit entrance hall', width: 1122, height: 1402 },
  'sun-over-the-forest': { image: '/images/products/sun-over-the-forest-room-2026-09-28.avif', alt: 'Sun Over the Forest by Markus Naarttijärvi framed above a cream sofa in a sunlit living room', width: 1122, height: 1402 },
  'swan-on-still-water': { image: '/images/products/swan-on-still-water-room-fresh-02-2026-09-28.avif', alt: 'Swan on Still Water by Markus Naarttijärvi framed above a green sideboard with flowers and books beside an olive chair', width: 1122, height: 1402 },
  'morning-cabin-room': { image: '/images/products/morning-cabin-room-room-2026-09-28.avif', alt: 'Morning, Cabin Room by Markus Naarttijärvi framed above a cream sofa in a quiet living room', width: 1080, height: 1457 },
  'path-through-the-trees': { image: '/images/products/path-through-the-trees-room-2026-09-28.avif', alt: 'Path Through the Trees by Markus Naarttijärvi framed above a black bench in a naturally lit hallway', width: 1122, height: 1402 },
  'sheep-on-the-track': { image: '/images/products/sheep-on-the-track-room-2026-09-28.avif', alt: 'Sheep on the Track by Markus Naarttijärvi framed above a wooden chair against a sage wall', width: 1122, height: 1402 },
  // Ishtar Bäcklund Dakhil's seven rooms are held back with her prints until
  // she has approved her prices and content (her agreement is signed);
  // restore them from branch ishtar/preview.
};

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
