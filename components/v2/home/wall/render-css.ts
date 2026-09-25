// CSS renderer, the fallback without WebGL2: layers and blend modes only.
// Ported from the wall-match prototype (render-css.js); the prototype's
// stylesheet rules are inlined here because this shop keeps page-specific
// styles out of globals.css.
//
//   wall    a flat paint fill, times light-css.png (mix-blend-mode: multiply), masked by
//           mask.png's alpha, over the photo. Multiply works on sRGB values and clamps at 1,
//           so wall that is brighter than the reference (sunlit) is flattened to the paint.
//   print   the artwork on paper in a 1000 × 1400 box, warped with matrix3d() into the slot,
//           then shade-css.png multiplied over the slot.

import { boxToQuadMatrix3d, expandQuad } from './geometry';
import { GROW_PX } from './render-gl';
import type { RendererOptions, WallRenderer, WallRoom, WallId } from './room';

const BOX_W = 1000;

const layer = (el: HTMLElement) => Object.assign(el.style, { position: 'absolute', left: '0', top: '0' });

export async function createCSSRenderer(container: HTMLElement, room: WallRoom, opts: RendererOptions): Promise<WallRenderer> {
  const slot = room.slot;
  const boxH = Math.round((BOX_W * slot.heightCm) / slot.widthCm);
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  layer(stage);
  Object.assign(stage.style, { width: `${room.width}px`, height: `${room.height}px`, transformOrigin: '0 0' });

  const base = new Image();
  base.src = room.base; base.width = room.width; base.height = room.height; base.alt = '';
  layer(base);

  const wall = document.createElement('div');
  layer(wall);
  Object.assign(wall.style, {
    width: `${room.width}px`, height: `${room.height}px`, isolation: 'isolate',
    maskImage: `url(${room.mask})`, webkitMaskImage: `url(${room.mask})`,
    maskSize: '100% 100%', webkitMaskSize: '100% 100%',
    transition: `background-color ${opts.duration('wall')}ms ease-in-out`,
  });
  const light = new Image();
  light.src = room.lightCss; light.width = room.width; light.height = room.height; light.alt = '';
  Object.assign(light.style, { display: 'block', mixBlendMode: 'multiply' });
  wall.appendChild(light);

  const box = document.createElement('div');
  layer(box);
  Object.assign(box.style, {
    width: `${BOX_W}px`, height: `${boxH}px`, background: slot.paper, overflow: 'hidden', transformOrigin: '0 0',
    transform: boxToQuadMatrix3d(BOX_W, boxH, expandQuad(slot.quad, GROW_PX)),
  });

  const shade = document.createElement('div');
  const [sx, sy, sw, sh] = slot.shadeRect;
  Object.assign(shade.style, {
    position: 'absolute', left: `${sx}px`, top: `${sy}px`, width: `${sw}px`, height: `${sh}px`,
    backgroundImage: `url(${slot.shadeCss})`, backgroundSize: '100% 100%', mixBlendMode: 'multiply',
  });

  stage.append(base, wall, box, shade);
  container.appendChild(stage);

  let current: HTMLImageElement | null = null;
  const decode = (im: HTMLImageElement) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve());
  await Promise.all([base, light].map(decode));

  let view = room.views.desktop;
  function resize() {
    const r = container.getBoundingClientRect();
    const s = r.width / view[2];
    stage.style.transform = `scale(${s}) translate(${-view[0]}px, ${-view[1]}px)`;
  }

  return {
    kind: 'css',
    setView(v) { view = v; resize(); },
    resize,
    setWall(id: WallId) { wall.style.backgroundColor = room.paint[id].photographed; },
    async setPrint(print) {
      if (current && current.dataset.slug === print.slug) return;
      const img = new Image();
      img.alt = ''; img.src = print.art; img.dataset.slug = print.slug;
      Object.assign(img.style, { position: 'absolute', left: '0', top: '0', width: `${BOX_W}px`, height: `${boxH}px`, transition: 'opacity linear' });
      await decode(img);
      img.style.transitionDuration = `${opts.duration('print')}ms`;
      img.style.opacity = current ? '0' : '1';
      box.appendChild(img);
      if (current) {
        const old = current;
        requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; }));
        setTimeout(() => old.remove(), opts.duration('print') + 50);
      }
      current = img;
    },
    preload(prints) { for (const p of prints) { const im = new Image(); im.src = p.art; } },
    destroy() { stage.remove(); },
  };
}
