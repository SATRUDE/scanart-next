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
  // Ishtar Bäcklund Dakhil's rooms (branch peggy/ishtar-artist-preview).
  stockholm: { image: '/images/products/stockholm-room.avif', alt: 'Stockholm by Ishtar Bäcklund Dakhil framed on a low black bench against a peach wall', width: 1122, height: 1402 },
  'frukt-och-gront': { image: '/images/products/frukt-och-gront-room.avif', alt: 'Frukt & Grönt by Ishtar Bäcklund Dakhil framed above a dining table in a blue kitchen', width: 1122, height: 1402 },
  'desert-circles': { image: '/images/products/desert-circles-room.avif', alt: 'Desert Circles by Ishtar Bäcklund Dakhil framed above a desk in a peach study', width: 1122, height: 1402 },
  'month-of-may': { image: '/images/products/month-of-may-room.avif', alt: 'Month of May by Ishtar Bäcklund Dakhil framed above a dining table with a vase of lilacs', width: 1122, height: 1402 },
  'flight-over-the-valley': { image: '/images/products/flight-over-the-valley-room.avif', alt: 'Flight Over the Valley by Ishtar Bäcklund Dakhil framed in a reading corner with an oak lounge chair', width: 1054, height: 1492 },
  'creature-among-blue-leaves': { image: '/images/products/creature-among-blue-leaves-room.avif', alt: 'Creature Among Blue Leaves by Ishtar Bäcklund Dakhil framed above a rattan sideboard', width: 1122, height: 1402 },
  // 'surfer-with-orange-sun' is off the site until Mark has confirmed the print with Ishtar (2026-09-26).
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
