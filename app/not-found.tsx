import Link from 'next/link';
import { TrackNotFound } from '@/components/TrackNotFound';
import './globals.css';

/**
 * The global 404, for a URL that matches no route in either language tree.
 *
 * It renders its own <html> and <body> on purpose. Splitting the app into (en)
 * and (no) route groups removed the single top-level layout, and Next.js has no
 * layout to wrap this file with any more, so the document is its own or there
 * is none. It also imports globals.css for the same reason: nothing above it
 * does. lang="en" is the honest default here, since an unmatched URL has no
 * language to speak of and English is our x-default.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="min-h-[60vh] flex items-center justify-center">
          <TrackNotFound />
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-medium text-neutral-900">404</h1>
            <p className="text-lg text-muted-foreground">Page not found</p>
            <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6">
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
