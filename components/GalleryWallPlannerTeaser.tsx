import { TrackedLink } from '@/components/TrackedLink';

/**
 * The relevant styling and sizing guides' hand-off to the planner.
 *
 * The planner used to be embedded here, mid-article. It outgrew a paragraph's
 * width, and a tool people come back to wants a URL of its own, so it lives at
 * /gallery-wall-planner and this card sends readers there at the moment the
 * article has just told them how to space a wall. English only, like the
 * planner: there is no Norwegian article route, and no Norwegian planner yet.
 */
export function GalleryWallPlannerTeaser({ articleSlug }: { articleSlug: string }) {
  // V2: a group under a rule, H3 and Body, one black button (layout.md
  // rules 3, 6 and 10). The old eyebrow line above the heading is gone: V2
  // has no kickers above headlines.
  return (
    <aside className="flex flex-col gap-group border-t border-ink pt-6">
      <div className="flex flex-col gap-3">
        <h3 className="type-h3">Plan your gallery wall, to scale</h3>
        <p className="type-body">
          Set your wall, drag the prints into place, and read off where every hook goes.
        </p>
      </div>
      <TrackedLink
        event="gallery-wall-planner-teaser-click"
        eventData={{ article: articleSlug }}
        href="/gallery-wall-planner"
        className="inline-flex w-fit items-center justify-center gap-3 bg-ink px-6 py-4 type-label text-on-primary transition-colors hover:bg-primary-hover"
      >
        Open the planner <span aria-hidden="true">→</span>
      </TrackedLink>
    </aside>
  );
}
