'use client';

import { useCallback, useEffect, useState } from 'react';
import { NotionBlockRenderer } from '@/components/NotionBlockRenderer';
import type { NotionBlock } from '@/lib/articles';

const NAME_KEY = 'preview-comment-name';

interface RichTextSegment {
  plain_text?: string;
}

/** The block's own text, so a submitted comment carries a bit of the
 *  context it points at (`quote`) without asking the reader to type it. */
function blockPlainText(block: NotionBlock): string {
  const image = block.image as { caption?: RichTextSegment[] } | undefined;
  const richText = image
    ? image.caption
    : (block[block.type] as { rich_text?: RichTextSegment[] } | undefined)?.rich_text;
  return (richText ?? []).map((seg) => seg.plain_text ?? '').join('').trim().slice(0, 140);
}

interface PreviewComment {
  blockIndex: number;
  quote?: string;
  name: string;
  comment: string;
  createdAt?: string;
}

function formatCommentTime(comment: PreviewComment): string {
  if (!comment.createdAt) return '';
  const date = new Date(comment.createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Reader comments on a draft preview: under each block, a quiet "Comment"
 * affordance opens a small form (name, remembered in localStorage across
 * visits; comment). Posts through the same-origin app/api/preview-comments
 * proxy — this component never talks to socialagent directly, so the
 * browser never needs the socialagent origin and no CORS setup is needed
 * there. No account, no moderation UI: comments flow back into the studio.
 *
 * Renders each block through NotionBlockRenderer one at a time (rather than
 * the whole array at once) so a "Comment" affordance and any existing
 * thread can sit directly under the block they belong to. The one
 * consequence: consecutive list items each get their own <ul>/<ol> instead
 * of sharing one, which only affects this preview view, never the
 * published article.
 */
export function ReaderComments({
  token,
  blocks,
  articleSlug,
}: {
  token: string;
  blocks: NotionBlock[];
  articleSlug?: string;
}) {
  const [comments, setComments] = useState<PreviewComment[]>([]);
  const [name, setName] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? '');
    } catch {
      /* localStorage unavailable (private mode, blocked site data): the
       * name field just starts blank rather than remembered. */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/preview-comments?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list = Array.isArray(data) ? data : Array.isArray(data.comments) ? data.comments : [];
        setComments(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  const openForm = useCallback((index: number) => {
    setOpenIndex(index);
    setDraft('');
    setError(false);
  }, []);

  const submit = useCallback(
    async (index: number) => {
      const trimmedName = name.trim();
      const trimmedComment = draft.trim();
      if (!trimmedName || !trimmedComment) return;

      setSubmitting(true);
      setError(false);
      try {
        window.localStorage.setItem(NAME_KEY, trimmedName);
      } catch {
        /* ignore — the form still submits without the name being remembered */
      }

      try {
        const res = await fetch('/api/preview-comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            blockIndex: index,
            quote: blockPlainText(blocks[index]),
            name: trimmedName,
            comment: trimmedComment,
          }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const saved = await res.json().catch(() => null);
        setComments((prev) => [
          ...prev,
          saved && typeof saved === 'object' && 'comment' in saved
            ? (saved as PreviewComment)
            : { blockIndex: index, name: trimmedName, comment: trimmedComment, createdAt: new Date().toISOString() },
        ]);
        setOpenIndex(null);
        setDraft('');
      } catch {
        setError(true);
      } finally {
        setSubmitting(false);
      }
    },
    [blocks, draft, name, token]
  );

  return (
    <div>
      {blocks.map((block, index) => {
        const blockComments = comments.filter((c) => c.blockIndex === index);
        return (
          <div key={block.id} className="group/comment relative">
            <NotionBlockRenderer blocks={[block]} articleSlug={articleSlug} />

            <button
              type="button"
              onClick={() => openForm(index)}
              className="mb-2 text-xs text-neutral-400 opacity-0 transition-opacity group-hover/comment:opacity-100 focus-visible:opacity-100 hover:text-neutral-600 focus-visible:text-neutral-600 underline-offset-2 hover:underline"
            >
              Comment
            </button>

            {blockComments.length > 0 && (
              <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                {blockComments.map((c, i) => (
                  <li key={i} className="border-l-2 border-neutral-200 pl-3">
                    <span className="font-medium text-neutral-700">{c.name}</span>
                    {formatCommentTime(c) && <span className="ml-2 text-xs">{formatCommentTime(c)}</span>}
                    <p className="mt-0.5">{c.comment}</p>
                  </li>
                ))}
              </ul>
            )}

            {openIndex === index && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(index);
                }}
                className="mb-4 flex max-w-sm flex-col gap-2 rounded-md border border-neutral-200 p-3"
              >
                <label className="text-xs text-muted-foreground" htmlFor={`preview-comment-name-${index}`}>
                  Name
                </label>
                <input
                  id={`preview-comment-name-${index}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded border border-neutral-200 px-2 py-1 text-sm"
                  autoComplete="name"
                />
                <label className="text-xs text-muted-foreground" htmlFor={`preview-comment-text-${index}`}>
                  Comment
                </label>
                <textarea
                  id={`preview-comment-text-${index}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="rounded border border-neutral-200 px-2 py-1 text-sm"
                  rows={3}
                />
                {error && <p className="text-xs text-red-600">Could not send that — try again.</p>}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(null)}
                    className="text-xs text-muted-foreground hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !name.trim() || !draft.trim()}
                    className="rounded bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
