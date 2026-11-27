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
    short: 'We use cookies.',
    accept: 'Accept',
    reject: 'Reject',
    privacy: 'Privacy policy',
    privacyShort: 'Privacy',
    error: 'Your browser could not save this choice. Please allow site storage or clear this site’s data in your browser settings and try again.',
  },
  no: {
    title: 'Informasjonskapsler',
    body: 'Vi bruker informasjonskapsler for å gi deg en bedre opplevelse og relevante annonser.',
    // \u00AD: a soft hyphen, so the long word can break on the narrowest phones
    // (iPhone SE) instead of running into the Avslå button.
    short: 'Vi bruker informasjons\u00ADkapsler.',
    accept: 'Godta',
    reject: 'Avslå',
    privacy: 'Personvern',
    privacyShort: 'Personvern',
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
    {/* Phones: a slim strip, one row: the short wording and the privacy link
        on the left, Reject and Accept side by side on the right, both the same
        secondary button at least 44 px tall. On a product page the strip sits
        directly on top of the phone basket bar instead of over it (globals.css,
        body:has([data-basket-bar]) #advertising-consent), so Add to basket is
        never covered; elsewhere it sits at the bottom on its own. Tablet and
        desktop are unchanged. Same two choices with the same weight, nothing
        pre-chosen, and still nothing loads until Accept. */}
    <section
      id="advertising-consent"
      ref={region}
      tabIndex={-1}
      aria-labelledby="advertising-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] max-h-[80dvh] overflow-y-auto border-t border-line bg-bg page-x pt-[6px] pb-[calc(6px+env(safe-area-inset-bottom))] focus:outline-none tab:border-ink tab:py-6 tab:shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl flex-row items-center gap-3 tab:flex-col tab:items-stretch tab:gap-5 desk:flex-row desk:items-center desk:gap-10">
        <div className="min-w-0 flex-1">
          <h2 id="advertising-consent-title" className="sr-only tab:not-sr-only type-h3">{t.title}</h2>
          <p className="type-caption tab:mt-2 tab:type-small max-w-3xl">
            <span className="tab:hidden">{t.short}</span>
            <span className="hidden tab:inline">{t.body}</span>{' '}
            <Link href={locale === 'no' ? '/no/privacy#advertising' : '/privacy#advertising'} className="underline underline-offset-4 tab:mt-2 tab:block tab:w-fit">
              <span className="tab:hidden">{t.privacyShort}</span>
              <span className="hidden tab:inline">{t.privacy}</span>
            </Link>
          </p>
          {error && <p role="alert" className="mt-2 type-caption tab:type-small">{t.error}</p>}
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 tab:flex tab:gap-3">
          <Button variant="secondary" size="compact" className="min-h-11" onClick={() => choose('rejected')}>{t.reject}</Button>
          <Button variant="secondary" size="compact" className="min-h-11" onClick={() => choose('accepted')}>{t.accept}</Button>
        </div>
      </div>
    </section>
    </>
  );
}
