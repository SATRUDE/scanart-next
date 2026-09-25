'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { LanguagePicker } from '@/components/LanguagePicker';
import { SearchOverlay } from '@/components/v2/SearchOverlay';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { chromeAria, headerStrings, isNoPath } from '@/lib/i18n';

interface HeaderProps {
  // Live catalogue categories, derived server-side in the root layout so the
  // nav never links to an empty category or misses a populated one
  categories: string[];
}

/**
 * V2 header (Figma: Announcement 21:78, Nav 12:92, Nav · mobile 183:1244,
 * Nav · checkout 275:5612). Links on the left, the wordmark centred, then
 * Search, the language and currency control and the basket.
 *
 * Every top-level destination is a real link in the served HTML, so the nav
 * keeps doing its crawl job (docs/v2-seo.md). Search opens an overlay that
 * submits to the catalogue, as the previous header did.
 */
export const Header: React.FC<HeaderProps> = ({ categories }) => {
  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // The Header is mounted once in the root layout, which cannot know the
  // route, so the Norwegian tree is detected here: under /no the labels come
  // from the Norwegian chrome strings and nav links stay inside /no.
  const isNo = isNoPath(pathname);
  const p1 = isNo ? '/no' : '';
  const t = headerStrings[isNo ? 'no' : 'en'];
  const localPath = isNo ? (pathname === '/no' ? '/' : pathname.slice('/no'.length)) : pathname;
  const homeHref = isNo ? '/no' : '/';
  const artistsHref = isNo ? '/no/artists' : '/artists';
  const aboutHref = isNo ? '/no/about' : '/about';
  const helpHref = isNo ? '/no/help' : '/help';
  const categoryHrefPrefix = isNo ? '/no' : '';

  const currentPage = localPath === '/' ? 'home'
    : localPath.startsWith('/products') ? 'products'
    : localPath.startsWith('/product/') ? 'product'
    : localPath.startsWith('/inspire') ? 'inspire'
    : localPath.startsWith('/journal') ? 'journal'
    : localPath.startsWith('/article/') ? 'article'
    : localPath.startsWith('/artist') ? 'artists'
    : localPath.startsWith('/checkout') ? 'checkout'
    : localPath.startsWith('/about') ? 'about'
    : 'other';

  const basketLabel = `${t.basket} (${totalItems})`;

  // Checkout drops the full nav so nothing pulls away from paying
  // (Nav · checkout 275:5612); the footer stays.
  if (currentPage === 'checkout') {
    return (
      <header className="border-b border-line bg-bg">
        <div className="page-x flex h-[60px] tab:h-[88px] items-center justify-between">
          <button type="button" onClick={toggleCart} className="type-label w-[90px] tab:w-[400px] text-left">
            <span aria-hidden>← </span>
            <span className="tab:hidden">{t.checkout.backShort}</span>
            <span className="hidden tab:inline">{t.checkout.back}</span>
          </button>
          <Link href={homeHref} className="type-h3 whitespace-nowrap">Scandinavian Art</Link>
          <p className="type-label w-[90px] tab:w-[400px] text-right">
            <span className="tab:hidden">{t.checkout.secureShort}</span>
            <span className="hidden tab:inline">{t.checkout.secure}</span>
          </p>
        </div>
      </header>
    );
  }

  const nav = [
    { href: `${p1}/products`, label: t.nav.prints, key: 'products', current: currentPage === 'products' || currentPage === 'product' },
    { href: `${p1}/inspire`, label: t.nav.inspire, key: 'inspire', current: currentPage === 'inspire' },
    { href: `${p1}/journal`, label: t.nav.journal, key: 'journal', current: currentPage === 'journal' || currentPage === 'article' },
    { href: artistsHref, label: t.nav.artists, key: 'artists', current: currentPage === 'artists' },
    { href: aboutHref, label: t.nav.about, key: 'about', current: currentPage === 'about' },
  ];

  return (
    <>
      <div className="bg-brand text-on-primary">
        <p className="page-x flex h-9 items-center justify-center type-small text-center">{t.announcement}</p>
      </div>

      <header className="sticky top-0 z-50 w-full bg-bg">
        <div className="page-x flex h-[60px] tab:h-[88px] items-center">
          {/* Mobile: Menu · wordmark · Basket */}
          <button
            type="button"
            className="type-small w-[72px] text-left tab:hidden"
            aria-label={t.aria.openMenu}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            {t.menu}
          </button>

          <nav aria-label={chromeAria[isNo ? 'no' : 'en'].landmarks.main} className="hidden tab:flex flex-1 gap-8 type-small">
            {nav.map(item => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className="relative transition-opacity hover:opacity-60 aria-[current=page]:after:absolute aria-[current=page]:after:left-0 aria-[current=page]:after:-bottom-1 aria-[current=page]:after:h-px aria-[current=page]:after:w-3 aria-[current=page]:after:bg-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href={homeHref} className="flex-1 tab:flex-none text-center font-serif text-[22px] leading-[28px] tab:text-[34px] tab:leading-[42px] tab:tracking-[-0.01em] whitespace-nowrap">
            Scandinavian Art
          </Link>

          <div className="flex tab:flex-1 items-center justify-end gap-8 type-small">
            <button type="button" className="hidden tab:inline transition-opacity hover:opacity-60" onClick={() => setIsSearchOpen(true)}>
              {t.aria.search}
            </button>
            <div className="hidden tab:inline-flex">
              <LanguagePicker />
            </div>
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`${t.aria.openCart}, ${totalItems}`}
              className="w-[72px] tab:w-auto text-right transition-opacity hover:opacity-60 whitespace-nowrap"
            >
              {basketLabel}
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} isNo={isNo} />

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-full max-w-none border-0 bg-bg p-0 sm:max-w-none">
          <SheetTitle className="sr-only">{t.aria.navMenuTitle}</SheetTitle>
          <SheetDescription className="sr-only">{t.aria.navMenuDescription}</SheetDescription>
          <div className="flex h-full flex-col overflow-y-auto px-5 pb-8">
            <div className="flex h-[60px] items-center justify-between">
              <button type="button" className="type-small" onClick={() => setMobileMenuOpen(false)}>{t.close}</button>
              <Link href={homeHref} onClick={() => setMobileMenuOpen(false)} className="font-serif text-[22px] leading-[28px]">Scandinavian Art</Link>
              <span className="w-[42px]" />
            </div>
            <button
              type="button"
              className="mt-6 border-b border-ink pb-3 text-left type-lead text-ink-muted"
              onClick={() => { setMobileMenuOpen(false); setIsSearchOpen(true); }}
            >
              {t.searchPlaceholder}
            </button>
            <nav aria-label={chromeAria[isNo ? 'no' : 'en'].landmarks.menu} className="mt-10 flex flex-col gap-3">
              {nav.map(item => (
                <Link key={item.key} href={item.href} className="type-h2" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
              ))}
              <Link href={helpHref} className="type-h2" onClick={() => setMobileMenuOpen(false)}>{t.nav.help}</Link>
            </nav>
            <div className="mt-10 border-t border-line pt-6">
              <p className="type-caption">{t.categoriesLabel}</p>
              <div className="mt-3 flex flex-col gap-2 type-body">
                {categories.map(cat => {
                  const landing = getCategoryLandingByCategory(cat);
                  return (
                    <Link
                      key={cat}
                      href={landing ? `${categoryHrefPrefix}/category/${landing.slug}` : `${p1}/products?category=${cat}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t.categoryLabels[cat] ?? cat}
                    </Link>
                  );
                })}
                <Link href={`${p1}/products`} onClick={() => setMobileMenuOpen(false)}>{t.nav.shopAll}</Link>
              </div>
            </div>
            <div className="mt-10 border-t border-line pt-6">
              <LanguagePicker />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
