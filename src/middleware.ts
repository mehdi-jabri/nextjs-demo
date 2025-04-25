// middleware.ts
import { auth } from "./app/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: authData } = req;
  const isLoggedIn = !!authData?.user;
  const isAuthPage = nextUrl.pathname.startsWith('/auth');

  // Redirect to sign-in if accessing protected page without login
  // if (!isLoggedIn && !isAuthPage && nextUrl.pathname !== '/') {
  //   return NextResponse.redirect(new URL('/auth/signin', nextUrl));
  // }

  // Redirect to homepage if user is already logged in and trying to access auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

// Specify routes that should be protected by the middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
