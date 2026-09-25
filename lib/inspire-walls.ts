// The Inspire wall filter (Figma: Inspire · desktop 208:2720, filtered state
// 208:3510). Every room is tagged with its measured wall colour and its room
// type, and the two become the page's filters.
//
// The wall grouping is the brand file's wall-match/inspire-walls.json (Mark,
// 2026-09-25), copied here so the build does not read outside the repo. The
// room types are the ones the V2 design captions each scene with. The chip
// colours are the Swatch master's (237:3700), which the design uses in both
// the filter and the captions.
//
// Two rooms in the design are not here yet: Stockholm (Ishtar Bäcklund Dakhil,
// Hallway) and Family Trip (Mikko Saarainen, Child's room). Neither print is
// in this branch's catalogue and neither has a room scene in public/, so they
// would only drop out at render. Add them back when the prints are published.

export type WallId = 'blue' | 'yellow' | 'peach' | 'green' | 'white';
export type RoomId = 'living-room' | 'kitchen' | 'dining-room' | 'home-office' | 'hallway' | 'childs-room';

export const WALLS: { id: WallId; chip: string }[] = [
  { id: 'blue', chip: '#c6d3d9' },
  { id: 'yellow', chip: '#e6d39e' },
  { id: 'peach', chip: '#e8c9ae' },
  { id: 'green', chip: '#c9c8a0' },
  { id: 'white', chip: '#e6e0d8' },
];

export const ROOMS: RoomId[] = ['living-room', 'kitchen', 'dining-room', 'home-office', 'hallway', 'childs-room'];

/**
 * Desktop tile shape. The design mixes them (layout.md rule 13): the first
 * room is 4:5, the kitchen pair square, the rest 2:3. On mobile every room is
 * 4:5, the scenes' own shape.
 */
export type TileRatio = 'portrait' | 'square' | 'tall';

export interface TaggedRoom {
  /** shopScenes key: the scene's lead print. */
  scene: string;
  wall: WallId;
  room: RoomId;
  ratio: TileRatio;
}

/**
 * In the design's reading order (down the first column, then the second, then
 * the third), which is also the mobile order and the JSON-LD order.
 */
export const TAGGED_ROOMS: TaggedRoom[] = [
  { scene: 'hummer-og-vin', wall: 'blue', room: 'dining-room', ratio: 'portrait' },
  { scene: 'eye-nose-eye', wall: 'blue', room: 'home-office', ratio: 'tall' },
  { scene: 'massa-applen', wall: 'peach', room: 'dining-room', ratio: 'tall' },
  { scene: 'ithinkithink', wall: 'yellow', room: 'home-office', ratio: 'tall' },
  { scene: 'swallow-dive', wall: 'yellow', room: 'hallway', ratio: 'tall' },
  { scene: 'tree-top-peach', wall: 'yellow', room: 'kitchen', ratio: 'square' },
  { scene: 'dancer', wall: 'green', room: 'living-room', ratio: 'tall' },
  { scene: 'eltsjoen', wall: 'white', room: 'living-room', ratio: 'tall' },
  { scene: 'hyttefrokost', wall: 'yellow', room: 'dining-room', ratio: 'tall' },
  { scene: 'trysilkaffe', wall: 'peach', room: 'kitchen', ratio: 'tall' },
  { scene: 'small-house-big-ocean', wall: 'blue', room: 'living-room', ratio: 'tall' },
  { scene: 'sunday-brunch', wall: 'yellow', room: 'kitchen', ratio: 'tall' },
  { scene: 'slingshot', wall: 'blue', room: 'childs-room', ratio: 'tall' },
  { scene: 'dragon', wall: 'blue', room: 'dining-room', ratio: 'tall' },
  { scene: 'rosa-blomster', wall: 'white', room: 'living-room', ratio: 'tall' },
];

/**
 * The prints each tagged scene shows, where it is more than its lead print.
 * The tree-top-peach kitchen hangs Massa Äpplen beside it (lib/shop-scenes.ts
 * says so in the alt).
 */
export const SCENE_PRINTS: Record<string, string[]> = {
  'tree-top-peach': ['tree-top-peach', 'massa-applen'],
};

export function isWall(value: string | null | undefined): value is WallId {
  return WALLS.some(w => w.id === value);
}

export function isRoom(value: string | null | undefined): value is RoomId {
  return ROOMS.includes(value as RoomId);
}

/** Visible labels for the filter and the captions. */
export interface InspireFilterStrings {
  wall: string;
  room: string;
  all: string;
  allRooms: string;
  walls: Record<WallId, string>;
  /** "Blue wall" in a caption. */
  wallCaption: Record<WallId, string>;
  rooms: Record<RoomId, string>;
  /** "{n} rooms" / "1 room". */
  countOne: string;
  countOther: string;
  empty: string;
  reset: string;
  /** Screen-reader words around each print link, kept from the old caption. */
  featuring: string;
  by: string;
  and: string;
}

export const inspireFilterStringsEn: InspireFilterStrings = {
  wall: 'Wall',
  room: 'Room',
  all: 'All',
  allRooms: 'All rooms',
  walls: { blue: 'Blue', yellow: 'Yellow', peach: 'Peach', green: 'Green', white: 'White' },
  wallCaption: { blue: 'Blue wall', yellow: 'Yellow wall', peach: 'Peach wall', green: 'Green wall', white: 'White wall' },
  rooms: {
    'living-room': 'Living room',
    kitchen: 'Kitchen',
    'dining-room': 'Dining room',
    'home-office': 'Home office',
    hallway: 'Hallway',
    'childs-room': 'Child’s room',
  },
  countOne: '1 room',
  countOther: '{n} rooms',
  empty: 'No rooms match both yet.',
  reset: 'Show all rooms',
  featuring: 'Featuring',
  by: 'by',
  and: 'and',
};
