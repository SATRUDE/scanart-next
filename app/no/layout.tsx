import { HtmlLang } from '@/components/HtmlLang';

// The Norwegian tree. Only the root layout renders <html> in Next.js, and it
// hardcodes lang="en", so this nested layout corrects the document language
// for /no pages two ways: the inline script runs before first paint on a full
// page load (so the served document is Norwegian for assistive tech and
// crawlers as soon as it executes), and HtmlLang keeps the attribute right
// across client-side navigation in and out of /no.
export default function NorwegianLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='no'" }}
      />
      <HtmlLang lang="no" />
      {children}
    </>
  );
}
