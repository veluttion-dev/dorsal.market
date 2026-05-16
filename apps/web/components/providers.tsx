'use client';
import { QueryProvider } from '@dorsal/api-client';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Client-only: msw/browser must never enter the server bundle.
const MswBootstrap = dynamic(
  () => import('@/components/msw-bootstrap').then((m) => m.MswBootstrap),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SessionProvider>
        <NuqsAdapter>
          <QueryProvider>
            {process.env.NODE_ENV === 'development' && <MswBootstrap />}
            {children}
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </NuqsAdapter>
      </SessionProvider>
    </ThemeProvider>
  );
}
