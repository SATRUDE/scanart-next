// This file was `middleware.ts` until 2026-09-02. Next 16 deprecated that
// filename in favour of `proxy`, and the dev server said so on every boot:
// "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
// The rename is the whole change; the behaviour below is untouched.
//
// No runtime change came with it, which is the part worth recording. The docs
// warn that `proxy` runs on nodejs and does not support the edge runtime, so a
// file that opted into edge would have moved runtime on rename. This one never
// declared a runtime, and Next 16 was already executing it through the proxy
// pipeline before the file was renamed: the build labels it "Proxy
// (Middleware)" and the dev request log times it as `proxy.ts`. So the old
// name was the only thing left of the old convention.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { noRedirectPathFor } from '@/lib/i18n';
import { withdrawnResponseFor, withdrawnPageHtml } from '@/lib/withdrawn';
import { WHERE_COOKIE, marketFor, paysInEuro } from '@/lib/euro';
import { NOTRACK_COOKIE, NOTRACK_MAX_AGE, notrackChoice } from '@/lib/notrack';



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

/**
 * `?notrack=on` / `?notrack=off` on any page (lib/notrack.ts): Mark's own
 * devices out of the shop's numbers. Set here, by the server, so the cookie
 * lasts 400 days even in Safari, which caps anything a script writes at seven.
 */
function withNotrack(request: NextRequest, response: NextResponse): NextResponse {
  const choice = notrackChoice(request.nextUrl.search);
  if (choice === 'on') {
    response.cookies.set(NOTRACK_COOKIE, '1', { path: '/', maxAge: NOTRACK_MAX_AGE, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:' });
  } else if (choice === 'off') {
    response.cookies.delete(NOTRACK_COOKIE);
  }
  return response;
}

export function proxy(request: NextRequest) {
  return withNotrack(request, route(request));
}

function route(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // Withdrawn work is answered before anything else, crawlers included
  // (lib/withdrawn.ts): the artist page 301s to the artists index, the prints
  // are 410 Gone so search engines drop them.
  const withdrawn = withdrawnResponseFor(pathname);
  if (withdrawn?.kind === 'redirect') {
    const url = request.nextUrl.clone();
    url.pathname = withdrawn.to;
    url.search = '';
    return NextResponse.redirect(url, 301);
  }
  if (withdrawn?.kind === 'gone') {
    return new NextResponse(withdrawnPageHtml(pathname.startsWith('/no/')), {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex',
        'cache-control': 'no-store',
      },
    });
  }

  const country = countryOf(request);

  // A Norwegian visitor, on an English page that HAS a Norwegian twin, who has
  // not been offered it before and is not a crawler: send them to the twin.
  //
  // A 302 rather than a 301, on purpose: this is a per-visitor decision and
  // must never be cached as if it were a permanent property of the URL. Both
  // URLs stay crawlable, hreflang stays honest, and the header control still
  // offers English back.
  const alreadyOffered = request.cookies.get(LOCALE_SEEN);
  const isBot = BOT.test(request.headers.get('user-agent') || '');
  const twin = noRedirectPathFor(pathname);

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
  //
  // One exception, once: before the euro list (24 Nov 2026) every EU visitor
  // was put on pounds automatically. A visitor whose cookie still says GB,
  // who is in a euro country and has no `currency-chosen` cookie, is moved to
  // euro. That cookie only exists from this release, so someone in the EU
  // who picked pounds by hand BEFORE it is moved too, once; they can pick
  // pounds again and are never moved after that. Accepted on purpose: the
  // alternative left every automatic EU visitor on the pounds list.
  const current = request.cookies.get('geo-country')?.value;
  const stalePounds = current === 'GB' && !request.cookies.get('currency-chosen') && paysInEuro(country);
  if (!current || stalePounds) {
    response.cookies.set('geo-country', marketFor(country), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // A euro visitor's own country, so checkout can start the delivery country
  // there (the price list cookie only says EU).
  const where = request.cookies.get(WHERE_COOKIE)?.value;
  if (paysInEuro(country) && where !== country) {
    response.cookies.set(WHERE_COOKIE, country, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  } else if (!paysInEuro(country) && where) {
    response.cookies.delete(WHERE_COOKIE);
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
