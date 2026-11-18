'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/v2/ui';
import { ADVERTISING_ENABLED } from '@/config/advertising';
import {
  ADVERTISING_SETTINGS_EVENT,
  clearAdvertisingLeftovers,
  loadConsentedAdvertising,
  parseAdvertisingChoice,
  readAdvertisingRecord,
  saveAdvertisingChoice,
  subscribeToAdvertisingChoice,
  type AdvertisingChoice,
} from '@/lib/advertising-consent';

const copy = {
  en: {
    title: 'Cookies',
    body: 'We use cookies to improve your experience and show you relevant ads.',
    accept: 'Accept',
    reject: 'Reject',
    privacy: 'Privacy policy',
    error: 'Your browser could not save this choice. Please allow site storage or clear this site’s data in your browser settings and try again.',
  },
  no: {
    title: 'Informasjonskapsler',
    body: 'Vi bruker informasjonskapsler for å gi deg en bedre opplevelse og relevante annonser.',
    accept: 'Godta',
    reject: 'Avslå',
    privacy: 'Personvern',
    error: 'Nettleseren kunne ikke lagre valget. Tillat lagring for nettstedet, eller slett nettstedets data i nettleserinnstillingene og prøv igjen.',
  },
};
const serverRecord = () => null;

/** Rendered instead of the prompt while advertising is off (config/advertising.ts).
 * Shows nothing and loads nothing; it only removes what an earlier acceptance left. */
function AdvertisingOff() {
  useEffect(() => { clearAdvertisingLeftovers(); }, []);
  return null;
}

export function AdvertisingConsent({ locale }: { locale: 'en' | 'no' }) {
  return ADVERTISING_ENABLED ? <AdvertisingPrompt locale={locale} /> : <AdvertisingOff />;
}

/** Non-modal: visitors can keep browsing without accepting anything. */
function AdvertisingPrompt({ locale }: { locale: 'en' | 'no' }) {
  const record = useSyncExternalStore(subscribeToAdvertisingChoice, readAdvertisingRecord, serverRecord);
  const choice = parseAdvertisingChoice(record);
  const [opened, setOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);
  const region = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const t = copy[locale];

  useEffect(() => { loadConsentedAdvertising(); }, [record]);
  useEffect(() => {
    const open = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpened(true);
    };
    window.addEventListener(ADVERTISING_SETTINGS_EVENT, open);
    return () => window.removeEventListener(ADVERTISING_SETTINGS_EVENT, open);
  }, []);
  useEffect(() => { if (opened) region.current?.focus(); }, [opened]);

  const choose = (next: AdvertisingChoice) => {
    if (!saveAdvertisingChoice(next)) { setError(true); return; }
    setError(false);
    setOpened(false);
    setDismissed(true);
    returnFocus.current?.focus();
  };

  if (!opened && (choice !== null || dismissed)) return null;
  return (
    <>
    <noscript><style>{'#advertising-consent { display: none; }'}</style></noscript>
    {/* Phones: a slim bar (one short paragraph, the two choices side by side)
        so the print's name and price stay on the first screen; on a product
        page the old stacked panel covered everything under the picture.
        Tablet and desktop are unchanged. Same copy, same two choices with the
        same weight, nothing pre-chosen, and still nothing loads until Accept. */}
    <section
      id="advertising-consent"
      ref={region}
      tabIndex={-1}
      aria-labelledby="advertising-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] max-h-[80dvh] overflow-y-auto border-t border-ink bg-bg page-x pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-lg focus:outline-none tab:py-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-[10px] tab:gap-5 desk:flex-row desk:items-center desk:gap-10">
        <div className="flex-1">
          <h2 id="advertising-consent-title" className="sr-only tab:not-sr-only type-h3">{t.title}</h2>
          <p className="type-caption tab:mt-2 tab:type-small max-w-3xl">
            {t.body}{' '}
            <Link href={locale === 'no' ? '/no/privacy#advertising' : '/privacy#advertising'} className="underline underline-offset-4 tab:mt-2 tab:block tab:w-fit">{t.privacy}</Link>
          </p>
          {error && <p role="alert" className="mt-2 type-caption tab:type-small">{t.error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 tab:flex tab:flex-row desk:shrink-0">
          <Button variant="secondary" size="compact" onClick={() => choose('rejected')}>{t.reject}</Button>
          <Button variant="secondary" size="compact" onClick={() => choose('accepted')}>{t.accept}</Button>
        </div>
      </div>
    </section>
    </>
  );
}
