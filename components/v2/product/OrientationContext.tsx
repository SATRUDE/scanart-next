'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Orientation } from '@/lib/print-options';

/**
 * The chosen orientation on a product page whose print offers portrait and
 * landscape (lib/print-options.ts), shared by the buying controls (which set
 * it) and the gallery (which shows that orientation's images). A page without
 * the choice renders no provider, and both read null.
 *
 * `?orientation=landscape` in the address opens the page on that orientation,
 * and a choice is written back there (replaceState, no navigation), so a
 * landscape view can be linked.
 */
const OrientationContext = createContext<{ orientation: Orientation; setOrientation: (o: Orientation) => void } | null>(null);

export function OrientationProvider({ offered, children }: { offered: Orientation[]; children: ReactNode }) {
  const [orientation, setState] = useState<Orientation>(offered[0]);

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('orientation');
    const match = offered.find(o => o === asked);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off: read the address once after hydration, so the server HTML stays the default
    if (match) setState(match);
  }, [offered]);

  const setOrientation = (o: Orientation) => {
    setState(o);
    try {
      const url = new URL(window.location.href);
      if (o === offered[0]) url.searchParams.delete('orientation');
      else url.searchParams.set('orientation', o);
      window.history.replaceState(window.history.state, '', url);
    } catch {
      /* the choice still applies on the page */
    }
  };

  return <OrientationContext.Provider value={{ orientation, setOrientation }}>{children}</OrientationContext.Provider>;
}

export function useProductOrientation() {
  return useContext(OrientationContext);
}
