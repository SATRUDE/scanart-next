import { SiteDocument } from '../site-document';
import { siteMetadata } from '../site-metadata';

export const metadata = siteMetadata;

/**
 * Root layout for the English tree. One of two: see app/site-document.tsx for
 * why the tree is split into (en) and (no) route groups rather than sharing a
 * single root that hardcoded lang="en".
 */
export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="en">{children}</SiteDocument>;
}
