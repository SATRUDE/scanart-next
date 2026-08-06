import fs from 'fs/promises';
import path from 'path';

// The Inspire wall: styled room scenes tagged on the socialagent Inspiration
// page (InspireScene rows in its database). The build syncs them into
// public/notion-data/inspire.json via scripts/sync-articles.mjs; the
// committed file doubles as the no-database fallback snapshot.

export interface InspireScene {
  image: string;
  alt: string;
  /** Product slugs featured in the scene, in display order. */
  slugs: string[];
  width: number;
  height: number;
}

export async function getInspireScenes(): Promise<InspireScene[]> {
  const filePath = path.join(process.cwd(), 'public', 'notion-data', 'inspire.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const scenes: InspireScene[] = JSON.parse(data);
    return scenes.filter(s => s.image && s.slugs.length > 0);
  } catch {
    return [];
  }
}
