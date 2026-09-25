import type { Quad } from './geometry';

/*
 * "Start from your wall": the precomputed room, copied from the wall-match
 * prototype's build output (~/brands/scandinavian-art/wall-match/prototype,
 * build/prebuild.py → data/section.json). The layers live in
 * public/images/v2/wall/room19/ and were computed once for this photo; they
 * are not regenerated per build. Only the print list follows the catalogue,
 * and that is read from lib/products.ts on the server (lib/home.ts).
 *
 * To add a room, follow the prototype README ("Add a room template") and copy
 * its output here. No new generated images: a new room photo is a ChatGPT
 * prompt for Mark (the README has one).
 */

export type WallId = 'blue' | 'yellow' | 'peach' | 'green' | 'white';

/** The Inspire chips, in swatch order. Names are localised by the caller. */
export const WALLS: { id: WallId; hex: string }[] = [
  { id: 'blue', hex: '#C6D3D9' },
  { id: 'yellow', hex: '#E6D39E' },
  { id: 'peach', hex: '#E8C9AE' },
  { id: 'green', hex: '#C9C8A0' },
  { id: 'white', hex: '#E6E0D8' },
];

export const DEFAULT_WALL: WallId = 'peach';
export const DEFAULT_PRINT = 'dancer';

export interface WallSlot {
  size: string;
  widthCm: number;
  heightCm: number;
  /** The four inner corners of the frame, clockwise from top left (photo px). */
  quad: Quad;
  shade: string;
  shadeCss: string;
  shadeRect: [number, number, number, number];
  shadeScale: number;
  paper: string;
}

export interface WallRoom {
  id: string;
  width: number;
  height: number;
  base: string;
  /** The default state (DEFAULT_WALL, DEFAULT_PRINT) composited by the WebGL
   *  renderer itself, so the server image and the first canvas frame match. */
  still: string;
  mask: string;
  light: string;
  lightCss: string;
  lightScale: number;
  referenceLinear: [number, number, number];
  paint: Record<WallId, { linear: [number, number, number]; photographed: string }>;
  /** Crops of the photo shown: x, y, w, h in photo px. */
  views: { desktop: [number, number, number, number]; mobile: [number, number, number, number] };
  slot: WallSlot;
}

const DIR = '/images/v2/wall/room19';

export const ROOM: WallRoom = {
  id: 'room19',
  width: 1122,
  height: 1402,
  base: `${DIR}/base.jpg`,
  still: `${DIR}/still-peach-dancer.jpg`,
  mask: `${DIR}/mask.png`,
  light: `${DIR}/light.png`,
  lightCss: `${DIR}/light-css.png`,
  lightScale: 2.0,
  referenceLinear: [0.35153, 0.30499, 0.17789],
  paint: {
    blue: { linear: [0.26171, 0.31464, 0.34093], photographed: '#8C989E' },
    yellow: { linear: [0.39832, 0.3101, 0.12785], photographed: '#A99764' },
    peach: { linear: [0.41196, 0.27381, 0.17854], photographed: '#AC8F75' },
    green: { linear: [0.2839, 0.27891, 0.14389], photographed: '#91906A' },
    white: { linear: [0.3847, 0.35649, 0.32077], photographed: '#A7A199' },
  },
  // Desktop shows the top 16:10 of the photo (the 1280 × 800 container);
  // mobile the whole photo, as in the prototype.
  views: { desktop: [0, 0, 1122, 701], mobile: [0, 0, 1122, 1402] },
  slot: {
    size: '50x70cm',
    widthCm: 50,
    heightCm: 70,
    quad: [
      [455.03, 65.87],
      [744.99, 42.1],
      [737.53, 533.44],
      [453.23, 508.76],
    ],
    shade: `${DIR}/shade.png`,
    shadeCss: `${DIR}/shade-css.png`,
    shadeRect: [449, 38, 300, 500],
    shadeScale: 2.0,
    paper: '#F4F1EA',
  },
};

/** Where each print's artwork crop and dropdown chip live (cropped from the
 *  product image inside its oak frame, build/prebuild.py's art_box). */
export const wallArtPath = (slug: string) => `/images/v2/wall/prints/${slug}.jpg`;
export const wallChipPath = (slug: string) => `/images/v2/wall/chips/${slug}.jpg`;

/** One print the room can hang: serialisable, built on the server. */
export interface WallPrint {
  slug: string;
  name: string;
  artist: string;
  /** Size label, "50 × 70 cm". */
  size: string;
  /** Prices at the slot's size, in every currency; the client picks the visitor's. */
  prices: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number };
  art: string;
  chip: string;
  href: string;
}

/** Renderer contract shared by the WebGL and CSS versions. */
export interface WallRenderer {
  kind: 'webgl' | 'css';
  setView(view: [number, number, number, number]): void;
  resize(): void;
  setWall(id: WallId): void;
  setPrint(print: Pick<WallPrint, 'slug' | 'art'>): Promise<void>;
  preload(prints: Pick<WallPrint, 'slug' | 'art'>[]): void;
  destroy(): void;
}

export interface RendererOptions {
  /** Transition length in ms; 0 under reduced motion. */
  duration: (kind: 'wall' | 'print') => number;
}
