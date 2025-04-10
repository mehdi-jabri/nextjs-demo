
// app/(protected)/dashboard/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/app/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Check if user is logged in and has admin role
  if (!session || !session.user?.roles?.includes("admin")) {
    // Redirect to homepage if not an admin
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
