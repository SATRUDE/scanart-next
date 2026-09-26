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
