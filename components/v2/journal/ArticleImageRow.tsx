import Image from 'next/image';
import { Meta } from '@/components/v2/ui';
import { scenePosition } from '@/lib/scene-focus';
import type { ImageRowItem } from '@/lib/markdown-blocks';

/**
 * The widths and ratios the row cycles through (Figma Article 194:6049):
 * alternating 4- and 3-column widths at their own heights, bottom edges shared,
 * so the row is never a uniform grid. Mobile (194:6193) is one size, 220 at 4:5.
 */
const WIDTHS = ['w-[220px] tab:w-[296px] desk:w-[405px]', 'w-[220px] tab:w-[240px] desk:w-[296px]'];
const RATIOS = ['tab:aspect-[4/7]', 'tab:aspect-[4/5]', 'tab:aspect-[2/3]', 'tab:aspect-[9/16]'];

/**
 * Image row, written in an article body as an `::images` block. It starts on
 * the text column and runs off the right edge of the viewport, scrolling
 * sideways: the same bleed as the article page's featured prints row, with the
 * text column's offset worked out from the grid tokens (3 columns and gutters
 * on desktop, 1 on tablet) so the first image lines up with the text above.
 *
 * next/image throughout, with the writer's alt text. Local files are
 * optimised; a remote URL is passed through unoptimised, because the
 * optimiser refuses any host outside next.config's allow-list and a writer
 * may paste one.
 */
export function ArticleImageRow({
  images,
  className = '',
  offset = true,
}: {
  images: ImageRowItem[];
  className?: string;
  /** False where the row already sits on the text column (the preview's one-column body). */
  offset?: boolean;
}) {
  return (
    <div className={className}>
      <ul
        className={[
          'mr-[calc(50%-50vw)] flex snap-x items-end gap-3 overflow-x-auto pr-[calc(50vw-50%)] pb-2 tab:gap-gutter',
          offset &&
            'tab:pl-[calc((100%-7*var(--sa-gutter))/8+var(--sa-gutter))] tab:scroll-pl-[calc((100%-7*var(--sa-gutter))/8+var(--sa-gutter))]',
          offset &&
            'desk:pl-[calc((100%-11*var(--sa-gutter))/4+3*var(--sa-gutter))] desk:scroll-pl-[calc((100%-11*var(--sa-gutter))/4+3*var(--sa-gutter))]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {images.map((image, i) => (
          <li key={`${image.url}-${i}`} className={`shrink-0 snap-start ${WIDTHS[i % 2]}`}>
            <figure className="flex flex-col gap-tight">
              <div className={`relative aspect-[4/5] w-full overflow-hidden bg-image-bg ${RATIOS[i % RATIOS.length]}`}>
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 833px) 220px, (max-width: 1199px) 296px, 405px"
                  unoptimized={/^https?:\/\//i.test(image.url)}
                  // A room scene keeps its print in the crop (lib/scene-focus.ts).
                  style={{ objectPosition: scenePosition(image.url) }}
                  className="object-cover"
                />
              </div>
              {image.caption.length > 0 && (
                <figcaption className="type-caption">
                  <Meta items={image.caption} />
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
