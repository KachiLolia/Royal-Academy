import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  if (!sessionCookie && !isAuthPage && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionCookie) {
    // Note: this verifyToken uses Jose which works in Edge runtime
    const payload = await verifyToken(sessionCookie.value);
    
    if (!payload && !isAuthPage && !isApiRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if the user must change their password
    const isChangePasswordPage = request.nextUrl.pathname.startsWith('/change-password');
    if (payload && payload.mustChangePassword && !isChangePasswordPage && !isApiRoute) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    
    if (payload && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
