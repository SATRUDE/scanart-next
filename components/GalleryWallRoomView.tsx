'use client';

import { useRef } from 'react';
import { makeProjector, roomPolygons, type Camera, type Poly, type RoomInput } from '@/lib/gallery-wall-room';

/** The picture is always drawn at this size; the SVG scales to fit. */
export const ROOM_IMAGE = { width: 1600, height: 1000 };

const STYLE: Record<Poly['kind'], { fill: string; stroke: string; width: number; dash?: string }> = {
  side: { fill: '#f1f0ec', stroke: '#b5b3ad', width: 1.5 },
  wall: { fill: '#f7f6f3', stroke: '#a8a6a0', width: 2 },
  floor: { fill: '#e9e7e2', stroke: '#a8a6a0', width: 2 },
  grid: { fill: 'none', stroke: '#cfcdc7', width: 1 },
  eye: { fill: 'none', stroke: '#b5b3ad', width: 1.5, dash: '10 8' },
  frame: { fill: '#ffffff', stroke: '#1f1f1f', width: 3 },
  mat: { fill: 'none', stroke: '#c9c7c1', width: 1.5 },
  sofa: { fill: '#eeece7', stroke: '#8f8d88', width: 2 },
  'sofa-edge': { fill: 'none', stroke: '#8f8d88', width: 2 },
};

/**
 * The room, drawn. A pointer dragged across it turns the camera; the caller
 * owns the camera and passes the new yaw back in.
 */
export function GalleryWallRoomView({
  input, camera, onYaw, svgRef, label,
}: {
  input: RoomInput;
  camera: Camera;
  onYaw: (yaw: number) => void;
  svgRef?: React.Ref<SVGSVGElement>;
  label: string;
}) {
  const proj = makeProjector(camera, input.wallWidth, ROOM_IMAGE.width, ROOM_IMAGE.height);
  const polys = roomPolygons(input, proj);
  const drag = useRef<{ x: number; yaw: number } | null>(null);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={label}
      viewBox={`0 0 ${ROOM_IMAGE.width} ${ROOM_IMAGE.height}`}
      className="h-full w-full cursor-ew-resize touch-none select-none"
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, yaw: camera.yaw };
      }}
      onPointerMove={event => {
        if (!drag.current) return;
        const perPx = 90 / event.currentTarget.getBoundingClientRect().width;
        onYaw(Math.max(-70, Math.min(70, drag.current.yaw + (event.clientX - drag.current.x) * perPx)));
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
    >
      <rect width={ROOM_IMAGE.width} height={ROOM_IMAGE.height} fill="#ffffff" />
      {polys.map((poly, i) => {
        const style = STYLE[poly.kind];
        const d = poly.points.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        return (
          <path
            key={i}
            data-kind={poly.kind}
            d={poly.points.length > 2 ? `${d} Z` : d}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeDasharray={style.dash}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

/** The drawing as a PNG, at twice the drawn size, handed to the browser to save. */
export async function saveSvgAsPng(svg: SVGSVGElement, filename: string): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(ROOM_IMAGE.width * 2));
  clone.setAttribute('height', String(ROOM_IMAGE.height * 2));
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = ROOM_IMAGE.width * 2;
    canvas.height = ROOM_IMAGE.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!png) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(png);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
