import { NotFoundBody } from '@/components/v2/not-found/NotFoundBody';

// notFound() anywhere in the English tree (an unknown product, artist or
// article): the 404 inside this tree's own layout, so there is one document.
export default function EnglishNotFound() {
  return <NotFoundBody locale="en" />;
}
