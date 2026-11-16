'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { visitCampaign } from '@/lib/campaign';
import { trackMetaEngagedVisit } from '@/lib/commerce-measurement';
import { startEngagedVisit, type EngagedTrigger } from '@/lib/engaged-visit';
import { capturePostHog } from '@/lib/posthog';

/** Sends once per visit (T-0516, lib/engaged-visit.ts). PostHog is cookieless
 * and needs no consent; Meta is sent only when advertising was accepted. */
function onEngaged(trigger: EngagedTrigger): void {
  capturePostHog('engaged-visit', { trigger, ...visitCampaign() });
  trackMetaEngagedVisit(trigger);
}

export function EngagedVisit() {
  const pathname = usePathname();

  useEffect(() => {
    const visit = startEngagedVisit(onEngaged);
    const sync = () => visit.setVisible(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      visit.stop();
    };
  }, []);

  useEffect(() => {
    startEngagedVisit(onEngaged).pageView(pathname);
  }, [pathname]);

  return null;
}
