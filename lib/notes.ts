// Strips the private editorial asides socialagent lets a writer leave inline
// in a draft's markdown body — `[note: ask Mark about the framing]` — before
// that body reaches a reader. socialagent already strips these from the
// canonical published body; this mirrors the same behaviour here because the
// preview endpoint (a parallel, not-yet-landed socialagent PR) promises them
// "already stripped", but `markdownToBlocks` is also run locally against the
// synced body in `scripts/sync-articles.mjs`, so the same guarantee has to
// hold on this side too.
//
// A note tag can span several lines (`[note: two\nlines]`), so the match is
// non-greedy and multi-line (`[\s\S]*?`, not `.` which does not cross a
// newline). Removing the tag can leave its line blank (a note that sat on its
// own paragraph) or a run of blank lines where two notes stood back to back;
// either collapses to a single blank line (the normal paragraph gap) so the
// surrounding markdown reads exactly as if the note had never been there.
const NOTE_TAG = /\[note:[\s\S]*?\]/gi;

export function stripNotes(markdown: string): string {
  return (markdown ?? '')
    .replace(NOTE_TAG, '')
    // An inline note leaves the space either side of it doubled up
    // ("text  continues"); a note on its own line leaves that line blank.
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    // A note removed from its own paragraph leaves 3+ newlines where the
    // normal paragraph gap is one blank line (two newlines).
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
