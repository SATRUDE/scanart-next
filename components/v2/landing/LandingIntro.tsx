/**
 * The landing intro as the page header's lead: both paragraphs, clamped to
 * three lines with a Read more toggle.
 *
 * CSS only (docs/v2-seo.md, "Landing copy stays in the HTML"). Every word of
 * both paragraphs ships in the served HTML and stays in the accessibility tree
 * (the clamp is visual), and the toggle is a native checkbox driving `peer-*`
 * variants, so it works with no JavaScript at all. It replaces the old client
 * ReadMore, which needed a ResizeObserver to decide whether to show the button.
 */
export function LandingIntro({
  paragraphs,
  moreLabel = 'Read more',
  lessLabel = 'Read less',
  id = 'landing-intro-more',
}: {
  paragraphs: string[];
  moreLabel?: string;
  lessLabel?: string;
  id?: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <input id={id} type="checkbox" className="peer sr-only-sa" />
      <div className="line-clamp-4 tab:line-clamp-3 peer-checked:line-clamp-none [&_p+p]:mt-6">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <label
        htmlFor={id}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 type-small transition-colors hover:text-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-checked:[&_.more]:hidden [&_.less]:hidden peer-checked:[&_.less]:inline"
      >
        <span className="more">{moreLabel}</span>
        <span className="less">{lessLabel}</span>
      </label>
    </div>
  );
}
