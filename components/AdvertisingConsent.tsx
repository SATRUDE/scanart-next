'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/v2/ui';
import {
  ADVERTISING_SETTINGS_EVENT,
  loadConsentedPinterest,
  parseAdvertisingChoice,
  readAdvertisingRecord,
  saveAdvertisingChoice,
  subscribeToAdvertisingChoice,
  type AdvertisingChoice,
} from '@/lib/advertising-consent';

const copy = {
  en: {
    title: 'Advertising cookies',
    body: 'May we use Pinterest cookies to measure our ads and show you relevant ads on Pinterest? You can shop with either choice and change it in Cookie settings in the footer.',
    accept: 'Accept advertising',
    reject: 'Reject advertising',
    privacy: 'Privacy policy',
    error: 'Your browser could not save this choice. Please allow site storage or clear this site’s data in your browser settings and try again.',
  },
  no: {
    title: 'Informasjonskapsler for annonsering',
    body: 'Kan vi bruke informasjonskapsler fra Pinterest til å måle annonsene våre og vise deg relevante annonser på Pinterest? Du kan handle uansett hva du velger, og endre valget under Innstillinger for informasjonskapsler nederst på siden.',
    accept: 'Godta annonsering',
    reject: 'Avvis annonsering',
    privacy: 'Personvernerklæring',
    error: 'Nettleseren kunne ikke lagre valget. Tillat lagring for nettstedet, eller slett nettstedets data i nettleserinnstillingene og prøv igjen.',
  },
};
const serverRecord = () => null;

/** Non-modal: visitors can keep browsing without accepting anything. */
export function AdvertisingConsent({ locale }: { locale: 'en' | 'no' }) {
  const record = useSyncExternalStore(subscribeToAdvertisingChoice, readAdvertisingRecord, serverRecord);
  const choice = parseAdvertisingChoice(record);
  const [opened, setOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);
  const region = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const t = copy[locale];

  useEffect(() => { loadConsentedPinterest(); }, [record]);
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
    <section
      id="advertising-consent"
      ref={region}
      tabIndex={-1}
      aria-labelledby="advertising-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] max-h-[80dvh] overflow-y-auto border-t border-ink bg-bg page-x py-6 shadow-lg focus:outline-none"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 desk:flex-row desk:items-center desk:gap-10">
        <div className="flex-1">
          <h2 id="advertising-consent-title" className="type-h3">{t.title}</h2>
          <p className="mt-2 type-small max-w-3xl">{t.body}</p>
          <Link href={locale === 'no' ? '/no/privacy#advertising' : '/privacy#advertising'} className="mt-2 inline-block type-small underline underline-offset-4">{t.privacy}</Link>
          {error && <p role="alert" className="mt-2 type-small">{t.error}</p>}
        </div>
        <div className="flex flex-col gap-3 tab:flex-row desk:shrink-0">
          <Button variant="secondary" onClick={() => choose('rejected')}>{t.reject}</Button>
          <Button variant="secondary" onClick={() => choose('accepted')}>{t.accept}</Button>
        </div>
      </div>
    </section>
    </>
  );
}
