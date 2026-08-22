'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage, countries } from '@/contexts/LanguageContext';
import { track } from '@/lib/analytics';
import { LOCALE_LABEL, currentLocale, localeOptions, twinMissing } from '@/lib/locale-switch';

/**
 * One header control, two things: language and currency.
 *
 * WHAT THIS REPLACES, and why it is a correctness fix rather than a feature.
 * The old control was labelled by "language" and listed EN, NO, US, DA and SE,
 * but every option only ever changed the CURRENCY. The site has exactly two
 * languages, English and the /no tree, and "US", "DA" and "SE" are not among
 * them. So a visitor could pick "NO", reasonably expect Norwegian, and get
 * kroner with English text. The control claimed to do something it did not do.
 *
 * Now it says what it does. Two sections, each honest about its own scope:
 *
 * - LANGUAGE has two options, because two is what exists. Language lives in the
 *   URL, so choosing one navigates to that page's twin.
 * - CURRENCY has five, independent of language, because someone in Oslo may
 *   well want to pay in pounds and that is their business.
 *
 * THE GAP IT DELIBERATELY EXPOSES. Products and articles have no Norwegian
 * version: 16 products and 18 articles, 34 of the site's 74 URLs, including
 * every page where someone buys. On those pages Norsk is shown as unavailable
 * with a reason and a route to the Norwegian home, rather than being hidden
 * (which would imply the site is English-only) or appearing to work (which
 * would be the old lie again). Making it work everywhere means translating the
 * product pages, which is the next real piece of work and worth doing because
 * Norway converts search at 6.59% against Britain's 1.67%.
 */
export const LanguagePicker: React.FC = () => {
  const { selectedCountry, setSelectedCountry } = useLanguage();
  const pathname = usePathname() || '/';
  const locale = currentLocale(pathname);
  const locales = localeOptions(pathname);
  const noTwin = twinMissing(pathname);

  const chooseCurrency = (code: string) => {
    const country = countries.find(c => c.code === code);
    if (!country) return;
    track('currency-change', {
      from: selectedCountry.currency,
      to: country.currency,
      country: country.code,
    });
    setSelectedCountry(country);
  };

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
        aria-label={`Language and currency: ${LOCALE_LABEL[locale]}, ${selectedCountry.currency}`}
        data-language="true"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>
          {LOCALE_LABEL[locale]}
          <span className="text-muted-foreground"> · {selectedCountry.currency}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="border-b p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Language
          </p>
          <ul className="space-y-0.5">
            {locales.map(o =>
              o.current ? (
                <li
                  key={o.code}
                  aria-current="true"
                  className="rounded bg-secondary px-2 py-1.5 text-sm"
                >
                  {o.label}
                </li>
              ) : o.href ? (
                <li key={o.code}>
                  <Link
                    href={o.href}
                    onClick={() => track('language-change', { to: o.code, from: locale })}
                    className="block rounded px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    {o.label}
                  </Link>
                </li>
              ) : (
                <li key={o.code} className="px-2 py-1.5 text-sm text-muted-foreground">
                  {o.label}
                  <span className="ml-1 text-xs">(not on this page yet)</span>
                </li>
              )
            )}
          </ul>
          {noTwin && (
            <p className="mt-2 text-xs text-muted-foreground">
              This page is only in English so far.{' '}
              <Link href="/no" className="underline underline-offset-2">
                Go to the Norwegian site
              </Link>
            </p>
          )}
        </div>

        <div className="p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Currency
          </p>
          <ul className="space-y-0.5">
            {countries.map(c => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => chooseCurrency(c.code)}
                  aria-current={c.code === selectedCountry.code ? 'true' : undefined}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                    c.code === selectedCountry.code ? 'bg-secondary' : 'hover:bg-secondary'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.currency}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};
