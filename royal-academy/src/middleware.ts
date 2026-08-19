import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  if (!sessionCookie && !isAuthPage && !isApiRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie) {
    // Note: this verifyToken uses Jose which works in Edge runtime
    const payload = await verifyToken(sessionCookie.value);
    
    if (!payload && !isAuthPage && !isApiRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if the user must change their password
    const isChangePasswordPage = request.nextUrl.pathname.startsWith('/change-password');
    if (payload && payload.mustChangePassword && !isChangePasswordPage && !isApiRoute) {
      const changePasswordUrl = request.nextUrl.clone();
      changePasswordUrl.pathname = '/change-password';
      return NextResponse.redirect(changePasswordUrl);
    }
    
    if (payload && isAuthPage) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashboardUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
