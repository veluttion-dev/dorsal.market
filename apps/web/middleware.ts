import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from './auth.config';

const { auth: authMiddleware } = NextAuth(authConfig);

export default function middleware(req: NextRequest) {
  return authMiddleware(req as never, undefined as never) as unknown as Promise<NextResponse>;
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
