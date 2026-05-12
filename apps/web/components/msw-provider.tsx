'use client';
import {
  type ApiModule,
  buildHandlers,
  deriveMockedModules,
  parseRealModules,
} from '@dorsal/api-client';
import { type ReactNode, useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== 'development');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const real = parseRealModules(process.env.NEXT_PUBLIC_REAL_API_MODULES);
    const mocked = deriveMockedModules(real).filter(
      (m): m is Exclude<ApiModule, 'dorsals'> => m !== 'dorsals',
    );
    if (mocked.length === 0) {
      setReady(true);
      return;
    }
    (async () => {
      const { setupWorker } = await import('msw/browser');
      const worker = setupWorker(...buildHandlers(mocked));
      await worker.start({ onUnhandledRequest: 'bypass' });
      setReady(true);
    })().catch(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
