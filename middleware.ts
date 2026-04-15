import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_COUNTRIES = ['GB', 'NO', 'US', 'DK', 'SE'];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only set if cookie doesn't exist yet (don't override user's manual choice)
  if (!request.cookies.get('geo-country')) {
    const country = request.headers.get('x-vercel-ip-country') || 'GB';
    const detected = SUPPORTED_COUNTRIES.includes(country) ? country : 'GB';
    response.cookies.set('geo-country', detected, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|images|notion-data).*)',
};
