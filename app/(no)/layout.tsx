import { SiteDocument } from '../site-document';
import { siteMetadata } from '../site-metadata';

export const metadata = siteMetadata;

/**
 * Root layout for the Norwegian tree, and the whole point of the split: these
 * pages now serve lang="no" in the HTML itself rather than having an inline
 * script correct it after the document has been sent.
 */
export default function NorwegianRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="no">{children}</SiteDocument>;
}
