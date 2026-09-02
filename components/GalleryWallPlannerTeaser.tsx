import { TrackedLink } from '@/components/TrackedLink';

/**
 * The gallery-wall guide's hand-off to the planner.
 *
 * The planner used to be embedded here, mid-article. It outgrew a paragraph's
 * width, and a tool people come back to wants a URL of its own, so it lives at
 * /gallery-wall-planner and this card sends readers there at the moment the
 * article has just told them how to space a wall. English only, like the
 * planner: there is no Norwegian article route, and no Norwegian planner yet.
 */
export function GalleryWallPlannerTeaser() {
  return (
    <aside className="not-prose my-10 flex flex-col gap-4 border-y border-neutral-300 py-7 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <p className="text-xs uppercase tracking-wide text-neutral-600">Try it on your own wall</p>
        <h3 className="mt-1 text-2xl font-medium text-neutral-900">Plan your gallery wall, to scale</h3>
        <p className="mt-2 leading-relaxed text-neutral-700">
          Set your wall, drag the prints into place, and read off where every hook goes.
        </p>
      </div>
      <TrackedLink
        event="gallery-wall-planner-teaser-click"
        eventData={{ article: 'create-an-art-wall' }}
        href="/gallery-wall-planner"
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Open the planner <span aria-hidden="true" className="ml-1">→</span>
      </TrackedLink>
    </aside>
  );
}
