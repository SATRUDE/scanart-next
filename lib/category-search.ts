/** Shared by the search overlay and shop grid so translated category queries agree. */
const aliases: Record<string, readonly string[]> = {
  Photography: ['fotografi', 'fotokunst', 'fotografiske kunsttrykk'],
};

export function matchesCategoryQuery(category: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  return [category, ...(aliases[category] ?? [])].some(label => label.toLowerCase().includes(q));
}
