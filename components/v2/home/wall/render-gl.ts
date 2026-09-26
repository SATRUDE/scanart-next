// WebGL2 renderer: the whole room in one pass, in linear light. Ported from
// the wall-match prototype (render-gl.js); the maths is unchanged.
//
//   wall    out = base + mask * (paint - reference) * light
//           (on pure wall that is base * paint / reference, compose.py's per-channel recolour;
//            at a soft edge only the wall's share of the pixel changes)
//   print   the artwork, projected into the slot's four corners, times the slot's shading
//
// Every texture is 8-bit sRGB and decoded in the shader; light and shade are stored as
// srgb(value / scale), so values above 1 (sunlit wall) survive.

import { squareToQuad, invert3, quadSize } from './geometry';
import type { RendererOptions, WallRenderer, WallRoom, WallId } from './room';

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uBase, uMask, uLight, uShade, uArtA, uArtB;
uniform vec2 uCanvas, uPhoto;
uniform vec4 uView;          // crop of the photo shown: x, y, w, h (photo px)
uniform vec3 uRef, uPaintA, uPaintB, uPaper;
uniform float uPaintMix, uArtMix, uLightScale, uShadeScale;
uniform mat3 uToSlot;        // photo px -> slot uv (0..1)
uniform vec4 uShadeRect;     // x, y, w, h of the shade texture (photo px)
uniform vec2 uGrow;          // paper reaches this far past the slot edge (uv), under the frame
uniform vec2 uArtLo;         // where the artwork starts (uv): under the frame, as there is no margin
uniform float uHasArtB, uHasArt;
out vec4 outColor;

vec3 lin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 srgb(vec3 l) { l = clamp(l, 0.0, 1.0); return mix(l * 12.92, 1.055 * pow(l, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l)); }

// coverage of the box [lo, hi] at uv, anti-aliased over one screen pixel
float boxCover(vec2 uv, vec2 lo, vec2 hi) {
  vec2 fw = max(fwidth(uv), vec2(1e-6));
  vec2 d = min(uv - lo, hi - uv) / fw;
  return clamp(min(d.x, d.y) + 0.5, 0.0, 1.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uCanvas;
  vec2 photo = uView.xy + p * uView.zw;
  vec2 tuv = photo / uPhoto;

  vec3 base = lin(texture(uBase, tuv).rgb);
  float m = texture(uMask, tuv).a;
  vec3 light = lin(texture(uLight, tuv).rgb) * uLightScale;
  vec3 paint = mix(uPaintA, uPaintB, uPaintMix);
  vec3 col = base + m * (paint - uRef) * light;

  // print: computed for every pixel (derivatives and mipmapped lookups need uniform flow)
  vec3 s = uToSlot * vec3(photo, 1.0);
  vec2 uv = s.xy / s.z;
  float cover = boxCover(uv, -uGrow, 1.0 + uGrow) * uHasArt;
  vec3 shade = lin(texture(uShade, (photo - uShadeRect.xy) / uShadeRect.zw).rgb) * uShadeScale;
  vec2 auv = clamp(uv, 0.0, 1.0);
  float artCover = boxCover(uv, uArtLo, 1.0 - uArtLo);
  vec3 art = mix(lin(texture(uArtA, auv).rgb), lin(texture(uArtB, auv).rgb), uArtMix * uHasArtB);
  vec3 surface = mix(uPaper, art, artCover);
  col = mix(col, surface * shade, cover);
  outColor = vec4(srgb(col), 1.0);
}`;

// paper and artwork reach this far (photo px) past the measured slot edge, under the frame,
// so no sliver of the old print survives at the rebate
export const GROW_PX = 1.6;

const hexToLin = (hex: string): [number, number, number] =>
  [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`could not load ${src}`));
    im.src = src;
  });
}

type Vec3 = [number, number, number];

export async function createGLRenderer(container: HTMLElement, room: WallRoom, opts: RendererOptions): Promise<WallRenderer> {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL2 is not available');

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const locations = new Map<string, WebGLUniformLocation | null>();
  const U = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(prog, name));
    return locations.get(name)!;
  };

  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  function params(mip: boolean) {
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    if (mip) {
      gl!.generateMipmap(gl!.TEXTURE_2D);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
      if (aniso) gl!.texParameterf(gl!.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    } else {
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    }
  }
  function texture(unit: number, image: HTMLImageElement, mip = false) {
    const t = gl!.createTexture();
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
    params(mip);
    return t;
  }

  const slot = room.slot;
  const [base, mask, light, shade] = await Promise.all([room.base, room.mask, room.light, slot.shade].map(loadImage));
  texture(0, base, true); texture(1, mask); texture(2, light); texture(3, shade);
  gl.uniform1i(U('uBase'), 0); gl.uniform1i(U('uMask'), 1); gl.uniform1i(U('uLight'), 2);
  gl.uniform1i(U('uShade'), 3); gl.uniform1i(U('uArtA'), 4); gl.uniform1i(U('uArtB'), 5);

  // static uniforms
  gl.uniform2f(U('uPhoto'), room.width, room.height);
  gl.uniform3fv(U('uRef'), room.referenceLinear);
  gl.uniform1f(U('uLightScale'), room.lightScale);
  gl.uniform1f(U('uShadeScale'), slot.shadeScale);
  gl.uniform3fv(U('uPaper'), hexToLin(slot.paper));
  gl.uniform4fv(U('uShadeRect'), slot.shadeRect);
  const t = invert3(squareToQuad(slot.quad)); // row-major -> column-major for GLSL
  gl.uniformMatrix3fv(U('uToSlot'), false, [t[0], t[3], t[6], t[1], t[4], t[7], t[2], t[5], t[8]]);
  const [sw, sh] = quadSize(slot.quad);
  const grow: [number, number] = [GROW_PX / sw, GROW_PX / sh];
  gl.uniform2fv(U('uGrow'), grow);
  // The shop's product shots show bleed prints meeting the frame, so there is
  // no white margin (the prototype's default, see its README "White margin").
  gl.uniform2fv(U('uArtLo'), grow.map(g => -g));

  container.appendChild(canvas);

  // ---- state and animation ----
  const st = {
    paintA: null as Vec3 | null, paintB: null as Vec3 | null, paintT: 1, paintStart: 0,
    artA: null as string | null, artB: null as string | null, artT: 1, artStart: 0,
    view: room.views.desktop,
    raf: 0,
  };
  const artCache = new Map<string, HTMLImageElement>();
  const artTextures = { A: gl.createTexture(), B: gl.createTexture() };

  function uploadArt(which: 'A' | 'B', img: HTMLImageElement) {
    gl!.activeTexture(gl!.TEXTURE0 + (which === 'A' ? 4 : 5));
    gl!.bindTexture(gl!.TEXTURE_2D, artTextures[which]);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
    params(true);
  }

  const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

  function frame(now: number) {
    st.raf = 0;
    const dPaint = opts.duration('wall');
    const dArt = opts.duration('print');
    st.paintT = dPaint ? Math.min(1, (now - st.paintStart) / dPaint) : 1;
    st.artT = dArt ? Math.min(1, (now - st.artStart) / dArt) : 1;
    draw();
    if (st.artT >= 1 && st.artB) {
      // the crossfade has finished: B becomes A
      [artTextures.A, artTextures.B] = [artTextures.B, artTextures.A];
      st.artA = st.artB; st.artB = null;
      gl!.activeTexture(gl!.TEXTURE4); gl!.bindTexture(gl!.TEXTURE_2D, artTextures.A);
      gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, artTextures.B);
      draw();
    }
    if (st.paintT < 1 || st.artB) st.raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!st.raf) st.raf = requestAnimationFrame(frame); };

  function draw() {
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(U('uCanvas'), canvas.width, canvas.height);
    gl!.uniform4fv(U('uView'), st.view);
    gl!.uniform3fv(U('uPaintA'), st.paintA || room.referenceLinear);
    gl!.uniform3fv(U('uPaintB'), st.paintB || st.paintA || room.referenceLinear);
    gl!.uniform1f(U('uPaintMix'), ease(st.paintT));
    gl!.uniform1f(U('uHasArtB'), st.artB ? 1 : 0);
    gl!.uniform1f(U('uHasArt'), st.artA ? 1 : 0);
    gl!.uniform1f(U('uArtMix'), st.artT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function resize() {
    const r = container.getBoundingClientRect();
    // Display resolution (up to 2x), so the artwork is sharper than the photo.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    draw();
  }

  return {
    kind: 'webgl',
    setView(view) { st.view = view; resize(); },
    resize,
    setWall(id: WallId) {
      const target = room.paint[id].linear;
      if (!st.paintA) { st.paintA = target; st.paintB = target; st.paintT = 1; draw(); return; }
      // start from wherever the current transition is
      const e = ease(st.paintT);
      const from = st.paintA.map((a, i) => a + (st.paintB![i] - a) * e) as Vec3;
      st.paintA = from; st.paintB = target; st.paintT = 0; st.paintStart = performance.now();
      kick();
    },
    async setPrint(print) {
      let img = artCache.get(print.slug);
      if (!img) { img = await loadImage(print.art); artCache.set(print.slug, img); }
      if (!st.artA) { uploadArt('A', img); st.artA = print.slug; draw(); return; }
      if (st.artA === print.slug && !st.artB) return;
      if (st.artB) {
        // a fade is running: settle it, then fade again
        [artTextures.A, artTextures.B] = [artTextures.B, artTextures.A];
        st.artA = st.artB;
        gl!.activeTexture(gl!.TEXTURE4); gl!.bindTexture(gl!.TEXTURE_2D, artTextures.A);
      }
      uploadArt('B', img);
      st.artB = print.slug; st.artT = 0; st.artStart = performance.now();
      kick();
    },
    preload(prints) {
      for (const p of prints) {
        if (!artCache.has(p.slug)) loadImage(p.art).then(im => artCache.set(p.slug, im)).catch(() => {});
      }
    },
    destroy() {
      if (st.raf) cancelAnimationFrame(st.raf);
      canvas.remove();
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
