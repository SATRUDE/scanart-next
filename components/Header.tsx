'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, Search, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { LanguagePicker } from '@/components/LanguagePicker';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { headerStrings, isNoPath } from '@/lib/i18n';

interface HeaderProps {
  // Live catalogue categories, derived server-side in the root layout so the
  // nav never links to an empty category or misses a populated one
  categories: string[];
}

export const Header: React.FC<HeaderProps> = ({ categories }) => {
  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menuOpenedBySearch, setMenuOpenedBySearch] = useState(false);
  const mobileSearchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (mobileMenuOpen && mobileSearchRef.current && !menuOpenedBySearch) {
      mobileSearchRef.current.blur();
      const timer = setTimeout(() => mobileSearchRef.current?.blur(), 50);
      const timer2 = setTimeout(() => mobileSearchRef.current?.blur(), 100);
      const timer3 = setTimeout(() => mobileSearchRef.current?.blur(), 200);
      return () => { clearTimeout(timer); clearTimeout(timer2); clearTimeout(timer3); };
    }
  }, [mobileMenuOpen, menuOpenedBySearch]);

  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
      setMobileMenuOpen(false);
      setIsSearchOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      handleSearch(localSearchQuery);
    }
  };

  // The Header is mounted once in the root layout, which cannot know the
  // route, so the Norwegian tree is detected here: under /no the labels come
  // from the Norwegian chrome strings and nav links stay inside /no where a
  // Norwegian page exists (home, artists, about, help, categories). English
  // pages take the English branch and render exactly as before.
  const isNo = isNoPath(pathname);
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
    : localPath.startsWith('/artists') ? 'artists'
    : localPath.startsWith('/checkout') ? 'checkout'
    : localPath.startsWith('/about') ? 'about'
    : 'home';

  return (
    <>
      {/* Announcement bar: red-600 (#d4183d) from the DS foundation red ramp. */}
      <div className="bg-[#d4183d] text-white py-2">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{t.announcement}</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative flex h-16 items-center justify-between">
          <div className={`flex items-center ${isSearchOpen ? 'hidden md:hidden' : ''}`}>
            <Link href={homeHref} className="md:hidden text-xl tracking-wide font-medium transition-opacity hover:opacity-60">
              SCANDINAVIAN ART
            </Link>
            <Link
              href="/products"
              className={`hidden md:block transition-opacity hover:opacity-60 ${
                currentPage === 'products' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {t.nav.prints}
            </Link>
            <Link
              href="/inspire"
              className={`hidden md:block transition-opacity hover:opacity-60 ml-6 ${
                currentPage === 'inspire' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {t.nav.inspire}
            </Link>
            <Link
              href="/journal"
              className={`hidden md:block transition-opacity hover:opacity-60 ml-6 ${
                currentPage === 'journal' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {t.nav.journal}
            </Link>
            <Link
              href={artistsHref}
              className={`hidden md:block transition-opacity hover:opacity-60 ml-6 ${
                currentPage === 'artists' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {t.nav.artists}
            </Link>
            <Link
              href={aboutHref}
              className={`hidden md:block transition-opacity hover:opacity-60 ml-6 ${
                currentPage === 'about' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {t.nav.about}
            </Link>
          </div>

          <div className={`absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center ${isSearchOpen ? 'md:hidden' : ''}`}>
            <Link href={homeHref} className="text-xl tracking-wide font-medium transition-opacity hover:opacity-60">
              SCANDINAVIAN ART
            </Link>
          </div>

          {!isSearchOpen && (
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" aria-label={t.aria.search} className="hidden md:inline-flex" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" aria-label={t.aria.search} className="md:hidden"
                onClick={() => {
                  setMenuOpenedBySearch(true);
                  setMobileMenuOpen(true);
                  setTimeout(() => {
                    if (mobileSearchRef.current) {
                      mobileSearchRef.current.tabIndex = 0;
                      mobileSearchRef.current.focus();
                    }
                  }, 100);
                }}
              >
                <Search className="h-4 w-4" />
              </Button>

              <div className="hidden md:inline-flex">
                <LanguagePicker />
              </div>

              <Button variant="ghost" size="icon" aria-label={t.aria.openCart} onClick={toggleCart} className="relative">
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" aria-label={t.aria.openMenu} onClick={() => { setMenuOpenedBySearch(false); setMobileMenuOpen(true); }} className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isSearchOpen && (
            <div className="hidden md:flex absolute inset-0 bg-background items-center px-4 sm:px-6">
              <form onSubmit={handleSearchSubmit} className="w-full flex items-center">
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="flex-1 text-lg border-none border-b border-border bg-transparent focus:ring-0 focus:border-b-foreground focus-visible:ring-0 rounded-none px-0 pb-2"
                  autoFocus
                  data-search="true"
                />
                <Button variant="ghost" size="icon" aria-label={t.aria.closeSearch} type="button" onClick={() => { setIsSearchOpen(false); setLocalSearchQuery(''); }} className="ml-4">
                  <X className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t.aria.openMenu} className="md:hidden sr-only">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetTitle className="sr-only">{t.aria.navMenuTitle}</SheetTitle>
          <SheetDescription className="sr-only">{t.aria.navMenuDescription}</SheetDescription>
          <div className="flex flex-col h-full">
            <div className="py-[21px] px-[14px] border-b border-border/30" />
            <div className="py-[21px] px-[14px]">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    ref={mobileSearchRef}
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="pl-10 mobile-search-input"
                    data-search="true"
                    autoFocus={false}
                    tabIndex={mobileMenuOpen && !menuOpenedBySearch ? -1 : 0}
                    onClick={() => { if (mobileSearchRef.current) { mobileSearchRef.current.tabIndex = 0; mobileSearchRef.current.focus(); } }}
                  />
                </div>
              </form>
            </div>
            <nav className="flex flex-col space-y-6 text-[14px] text-left py-[0px] font-normal mt-[0px] mr-[0px] mb-[21px] ml-[0px]">
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4 px-[14px] py-[0px]">{t.categoriesLabel}</p>
                <div className="flex flex-col space-y-3 px-[14px] py-[0px]">
                  {categories.map((cat) => {
                    const landing = getCategoryLandingByCategory(cat);
                    return (
                    <Link key={cat} href={landing ? `${categoryHrefPrefix}/category/${landing.slug}` : `/products?category=${cat}`} className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>
                      {t.categoryLabels[cat] ?? cat}
                    </Link>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4 px-[14px] py-[0px]">{t.moreLabel}</p>
                <div className="flex flex-col space-y-3 px-[14px] py-[0px]">
                  <Link href="/products" className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>{t.nav.shopAll}</Link>
                  <Link href="/inspire" className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>{t.nav.inspire}</Link>
                  <Link href="/journal" className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>{t.nav.journal}</Link>
                  <Link href={artistsHref} className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>{t.nav.artists}</Link>
                  <Link href={aboutHref} className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>{t.nav.about}</Link>
                  <Link href={helpHref} className="text-left transition-opacity hover:opacity-60" onClick={() => setMobileMenuOpen(false)}>{t.nav.help}</Link>
                  <a href="mailto:hello@scandinavianart.co.uk" className="text-left transition-opacity hover:opacity-60">{t.sendEmail}</a>
                  <a href="https://www.instagram.com/helloscandinavianart/" target="_blank" rel="noopener noreferrer" className="text-left transition-opacity hover:opacity-60">Instagram</a>
                  <a href="https://www.facebook.com/people/Scandinavian-Art/61563171855842/" target="_blank" rel="noopener noreferrer" className="text-left transition-opacity hover:opacity-60">Facebook</a>
                </div>
              </div>
              <div className="pt-[14px] border-t pr-[14px] pb-[0px] pl-[14px]">
                <LanguagePicker />
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
    </>
  );
};
