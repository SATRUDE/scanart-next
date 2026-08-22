import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { noPathFor } from '@/lib/i18n';

const SUPPORTED_COUNTRIES = ['GB', 'NO', 'US', 'DK', 'SE'];

/** Countries whose visitors get Norwegian by default. Norway only: Danish and
 *  Swedish readers are not served by a Norwegian page any better than by an
 *  English one, and we do not have their languages. */
const NORWEGIAN_BY_DEFAULT = ['NO'];

/** Set once a visitor has been offered Norwegian, so the redirect happens at
 *  most once per person and never fights a manual choice. */
const LOCALE_SEEN = 'locale-offered';

/**
 * Crawlers must never be redirected by IP.
 *
 * Google's own guidance is that IP-based redirection can stop a crawler ever
 * seeing the other version of a page, and this site's hreflang declares English
 * as x-default. Googlebot also crawls mostly from US addresses, so it would not
 * be redirected anyway; this is belt and braces for the ones that are not, and
 * for Bing, which we are also trying to get into.
 */
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|lighthouse|headlesschrome/i;

/**
 * Where the visitor is, as far as we can tell.
 *
 * `x-vercel-ip-country` is the real signal and it is always present in
 * production. It is absent on localhost and on any host that is not Vercel,
 * which made the whole Norwegian-by-default behaviour impossible to see while
 * developing, so `Accept-Language` is a fallback for exactly that case.
 *
 * It is a FALLBACK and not a second signal on purpose. Browser language says
 * what someone reads, not where they are, and a Norwegian speaker in London
 * should not be redirected out of English. Since the geo header is always there
 * in production, this branch never runs for a real visitor: it exists so the
 * feature can be tested by changing a browser's preferred language.
 */
function countryOf(request: NextRequest): string {
  const geo = request.headers.get('x-vercel-ip-country');
  if (geo) return geo;
  const accept = request.headers.get('accept-language') || '';
  return /\b(nb|nn|no)\b/i.test(accept.split(',')[0] || '') ? 'NO' : 'GB';
}

export function middleware(request: NextRequest) {
  const country = countryOf(request);
  const { pathname, search } = request.nextUrl;

  // A Norwegian visitor, on an English page that HAS a Norwegian twin, who has
  // not been offered it before and is not a crawler: send them to the twin.
  //
  // A 302 rather than a 301, on purpose: this is a per-visitor decision and
  // must never be cached as if it were a permanent property of the URL. Both
  // URLs stay crawlable, hreflang stays honest, and the header control still
  // offers English back.
  const alreadyOffered = request.cookies.get(LOCALE_SEEN);
  const isBot = BOT.test(request.headers.get('user-agent') || '');
  const twin = noPathFor(pathname);

  if (!alreadyOffered && !isBot && NORWEGIAN_BY_DEFAULT.includes(country) && twin) {
    const url = request.nextUrl.clone();
    url.pathname = twin;
    url.search = search;
    const redirect = NextResponse.redirect(url, 302);
    redirect.cookies.set(LOCALE_SEEN, '1', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    if (!request.cookies.get('geo-country')) {
      redirect.cookies.set('geo-country', country, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    }
    return redirect;
  }

  const response = NextResponse.next();

  // Currency. Only set if the cookie does not exist, so a manual choice in the
  // header control is never overridden by where someone happens to be.
  if (!request.cookies.get('geo-country')) {
    const detected = SUPPORTED_COUNTRIES.includes(country) ? country : 'GB';
    response.cookies.set('geo-country', detected, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Remember that this visitor has had their one redirect, including the ones
  // who were never eligible, so nobody is bounced later by a change of IP.
  if (!alreadyOffered) {
    response.cookies.set(LOCALE_SEEN, '1', { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|images|notion-data).*)',
};
