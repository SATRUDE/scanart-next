'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

// Fires once per 404 view with the missing path and where the visitor came
// from: a broken inbound link or a steadily-hit dead URL is invisible without
// this, and a recurring path in the data is a redirect opportunity.
export function TrackNotFound() {
  const pathname = usePathname();

  useEffect(() => {
    track('404', { path: pathname, referrer: document.referrer || 'direct' });
  }, [pathname]);

  return null;
}
