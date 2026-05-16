import NextAuth from 'next-auth';
import type { NextRequest, NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth: authProxy } = NextAuth(authConfig);

export default function proxy(req: NextRequest) {
  return authProxy(req as never, undefined as never) as unknown as Promise<NextResponse>;
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
