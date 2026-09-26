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
  // Ishtar Bäcklund Dakhil's rooms (branch peggy/ishtar-artist-preview).
  stockholm: { image: '/images/products/stockholm-room.avif', alt: 'Stockholm by Ishtar Bäcklund Dakhil framed on a low black bench against a peach wall', width: 1122, height: 1402 },
  'frukt-och-gront': { image: '/images/products/frukt-och-gront-room.avif', alt: 'Frukt & Grönt by Ishtar Bäcklund Dakhil framed above a dining table in a blue kitchen', width: 1122, height: 1402 },
  'desert-circles': { image: '/images/products/desert-circles-room.avif', alt: 'Desert Circles by Ishtar Bäcklund Dakhil framed above a desk in a peach study', width: 1122, height: 1402 },
  'lilac-geometry': { image: '/images/products/lilac-geometry-room.avif', alt: 'Lilac Geometry by Ishtar Bäcklund Dakhil framed above a dining table with a vase of lilacs', width: 1122, height: 1402 },
  'bird-above-the-valley': { image: '/images/products/bird-above-the-valley-room.avif', alt: 'Bird Above the Valley by Ishtar Bäcklund Dakhil framed in a reading corner with an oak lounge chair', width: 1054, height: 1492 },
  'creature-among-blue-leaves': { image: '/images/products/creature-among-blue-leaves-room.avif', alt: 'Creature Among Blue Leaves by Ishtar Bäcklund Dakhil framed above a rattan sideboard', width: 1122, height: 1402 },
  // 'surfer-with-orange-sun' is off the site until Mark has confirmed the print with Ishtar (2026-09-26).
};

export const articleSceneSlugs: Record<string, string> = {
  'scandinavian-abstract-art': 'dancer',
  'nordic-botanical-prints': 'hummer-og-vin',
  'scandinavian-illustrators': 'eye-nose-eye',
  'how-to-frame-an-art-print': 'hyttefrokost',
  'complete-guide-choosing-print-sizes': 'hummer-og-vin',
  'art-print-or-poster': 'hummer-og-vin',
  'bedroom-wall-art-ideas': 'rosa-blomster',
  'kitchen-and-dining-wall-art': 'hyttefrokost',
};
