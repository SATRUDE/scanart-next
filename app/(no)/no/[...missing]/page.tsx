import { notFound } from 'next/navigation';

// Any /no URL no other route matches. Throwing notFound() here hands it to
// app/(no)/not-found.tsx, so a Norwegian visitor gets the Norwegian 404 in the
// Norwegian layout (lang="no") rather than the English global one.
export default function NorwegianUnmatched() {
  notFound();
}
