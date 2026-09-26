import { NotFoundBody } from '@/components/v2/not-found/NotFoundBody';

// notFound() anywhere in the Norwegian tree, and every unmatched /no URL (via
// no/[...missing]): the Norwegian 404, inside the Norwegian layout.
export default function NorwegianNotFound() {
  return <NotFoundBody locale="no" />;
}
