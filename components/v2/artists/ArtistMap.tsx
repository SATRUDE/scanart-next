import Image from 'next/image';

/**
 * Map (Figma 241:4047) with one Map marker (237:3732): the Nordic line map
 * zoomed 1.6× so the artist's city sits where the design puts Oslo, about 42%
 * across and 57% down an 8-column frame (843 × 600; 350 × 249 on mobile, the
 * same ratio). Drawn from public/images/map/nordics.svg, the brand file's
 * map/nordics.svg with a non-scaling stroke so the lines stay 1 px at any zoom.
 *
 * Marker positions are the brand file's map/cities.json, in the SVG's own
 * 843 × 1053 pixel space. A city not listed there gets no map rather than a
 * marker in the wrong place (the caller checks `hasCity`).
 *
 * Decorative: the caption under it says the same thing in words, so the map
 * itself is hidden from assistive tech.
 */
const MAP = { W: 843, H: 1053 };
const CITIES: Record<string, [number, number]> = {
  Bergen: [52.9, 681.7],
  Oslo: [210.8, 711.4],
  Gothenburg: [246.2, 847.7],
  Stockholm: [423.5, 747.4],
  Lahti: [644.2, 645.2],
};
const ZOOM = 1.6;
const FRAME = { W: 843, H: 600 };
const TARGET = { x: 0.42, y: 0.57 };

export function hasCity(city: string): boolean {
  return city in CITIES;
}

export function ArtistMap({ city, label, caption }: { city: string; label: string; caption: string }) {
  const point = CITIES[city];
  if (!point) return null;
  const [cx, cy] = point;
  // Percentages of the frame, so the same numbers hold at 843 and at 350.
  const width = ZOOM * 100;
  const left = TARGET.x * 100 - (ZOOM * cx * 100) / MAP.W;
  const top = TARGET.y * 100 - (ZOOM * cy * 100) / FRAME.H * (FRAME.W / MAP.W);
  const markerLeft = (cx / MAP.W) * 100;
  const markerTop = (cy / MAP.H) * 100;

  return (
    <figure className="flex flex-col gap-tight">
      <div aria-hidden className="relative aspect-[843/600] w-full overflow-hidden">
        <div className="absolute aspect-[843/1053]" style={{ width: `${width}%`, left: `${left}%`, top: `${top}%` }}>
          <Image src="/images/map/nordics.svg" alt="" fill unoptimized className="select-none" />
          <div
            className="absolute flex -translate-y-1/2 items-center gap-[6px] tab:gap-[10px]"
            style={{ left: `calc(${markerLeft}% - 6px)`, top: `${markerTop}%` }}
          >
            <span className="size-[8px] shrink-0 rounded-full bg-ink tab:size-3" />
            <span className="h-px w-3 shrink-0 bg-brand tab:w-[19px]" />
            <span className="bg-bg px-1 type-small tab:px-[6px] tab:type-body">{label}</span>
          </div>
        </div>
      </div>
      <figcaption className="type-caption">{caption}</figcaption>
    </figure>
  );
}
