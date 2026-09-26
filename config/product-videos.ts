// Light-motion clips for the product page (Figma Video 257:3920), keyed by
// product slug. Only prints listed here get a video; every other product page
// renders exactly as before, with the room still in the second slot.
//
// Files and encoding: ~/brands/scandinavian-art/motion/product-video/README.md.
// Each clip ships as AV1 (smaller, first choice) and H.264 (fallback), 1080 ×
// 1350, about 1 MB, with a first-frame poster that paints before any video
// byte loads. They live in public/video, on our own domain.
//
// Where it shows: the second image on desktop, the second slide on mobile.
// The standard print image always stays first and stays the preloaded LCP.
//
// The label is the video's accessible name, in both languages side by side
// for the same reason lib/product-image-alt.ts keeps its two vocabularies
// together: the gallery is a client component, and lib/i18n/no.ts must not
// reach the browser.

export interface ProductVideo {
  av1: string;
  h264: string;
  poster: string;
  /**
   * The desktop slot is taller than the clip's 4:5, so the crop is set to
   * keep the print whole (README: 30% for Rosa Blomster, reading light).
   */
  objectPosition: string;
  label: { en: string; no: string };
}

export const productVideos: Record<string, ProductVideo> = {
  'rosa-blomster': {
    av1: '/video/rosa-blomster-reading.av1.mp4',
    h264: '/video/rosa-blomster-reading.h264.mp4',
    poster: '/video/rosa-blomster-reading.poster.jpg',
    objectPosition: '30% 50%',
    label: {
      en: 'Rosa Blomster by Hedvig Wallin framed above a sofa, sunlight moving across the wall',
      no: 'Rosa Blomster av Hedvig Wallin innrammet over en sofa, med sollys som beveger seg over veggen',
    },
  },
  'massa-applen': {
    av1: '/video/massa-applen-rosa-blomster-afternoon.av1.mp4',
    h264: '/video/massa-applen-rosa-blomster-afternoon.h264.mp4',
    poster: '/video/massa-applen-rosa-blomster-afternoon.poster.jpg',
    // Massa Äpplen is the left-hand print of the pair; keep it whole in the tall slot.
    objectPosition: '38% 50%',
    label: {
      en: 'Massa Äpplen by Hedvig Wallin framed above a dining table, afternoon sunlight moving across the wall',
      no: 'Massa Äpplen av Hedvig Wallin innrammet over et spisebord, med ettermiddagssol som beveger seg over veggen',
    },
  },
  'small-house-big-ocean': {
    av1: '/video/small-house-big-ocean-quiet.av1.mp4',
    h264: '/video/small-house-big-ocean-quiet.h264.mp4',
    poster: '/video/small-house-big-ocean-quiet.poster.jpg',
    objectPosition: '40% 50%',
    label: {
      en: 'Small House Big Ocean by Hedvig Wallin framed above a bench, leaf shadows moving across the wall',
      no: 'Small House Big Ocean av Hedvig Wallin innrammet over en benk, med bladskygger som beveger seg over veggen',
    },
  },
};

export function getProductVideo(slug: string): ProductVideo | undefined {
  return productVideos[slug];
}
