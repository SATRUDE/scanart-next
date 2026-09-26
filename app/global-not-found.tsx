import type { Metadata } from 'next';
import { SiteDocument } from './site-document';
import { NOT_FOUND_COPY, NotFoundBody } from '@/components/v2/not-found/NotFoundBody';

// Any URL no route matches. It renders its own document (SiteDocument brings
// the styles, fonts, header and footer), in English, our x-default. Unmatched
// /no URLs never reach here: app/(no)/no/[...missing] gives them the Norwegian page.
export const metadata: Metadata = {
  title: { absolute: NOT_FOUND_COPY.en.title },
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <SiteDocument lang="en">
      <NotFoundBody locale="en" />
    </SiteDocument>
  );
}
