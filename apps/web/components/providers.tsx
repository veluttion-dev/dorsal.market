'use client';
import { FeedbackTab } from '@/components/feedback/feedback-tab.client';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@dorsal/api-client';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

// Client-only: msw/browser must never enter the server bundle.
const MswBootstrap = dynamic(
  () => import('@/components/msw-bootstrap').then((m) => m.MswBootstrap),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <NuqsAdapter>
          <QueryProvider>
            {process.env.NODE_ENV === 'development' && <MswBootstrap />}
            {children}
            <FeedbackTab />
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </NuqsAdapter>
      </SessionProvider>
    </ThemeProvider>
  );
}
