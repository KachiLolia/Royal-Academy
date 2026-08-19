import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  // Helper to build absolute URL for Railway
  const getAbsoluteUrl = (pathname: string) => {
    const host = request.headers.get('x-forwarded-host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}${pathname}`;
  };
  
  if (!sessionCookie && !isAuthPage && !isApiRoute) {
    return NextResponse.redirect(getAbsoluteUrl('/login'));
  }

  if (sessionCookie) {
    // Note: this verifyToken uses Jose which works in Edge runtime
    const payload = await verifyToken(sessionCookie.value);
    
    if (!payload && !isAuthPage && !isApiRoute) {
      // If token is invalid/expired, clear the cookie and redirect
      const response = NextResponse.redirect(getAbsoluteUrl('/login'));
      response.cookies.delete('session');
      return response;
    }
    
    if (payload && isAuthPage) {
      return NextResponse.redirect(getAbsoluteUrl('/dashboard'));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
