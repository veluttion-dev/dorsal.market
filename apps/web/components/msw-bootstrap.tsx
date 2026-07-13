'use client';
import { startMswBrowser } from '@/lib/msw-browser';
import { type ApiModule, deriveMockedModules, parseRealModules } from '@dorsal/api-client';
import { useEffect } from 'react';

/**
 * Starts the MSW browser worker for the API modules that are still mocked.
 * Renders nothing. Loaded via next/dynamic with `ssr: false` (see providers.tsx)
 * so `msw/browser` — whose package exports map has `"node": null` — never enters
 * the server bundle.
 */
export function MswBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const real = parseRealModules(process.env.NEXT_PUBLIC_REAL_API_MODULES);
    const mocked = deriveMockedModules(real).filter(
      (m): m is Exclude<ApiModule, 'dorsals'> => m !== 'dorsals',
    );
    if (mocked.length === 0) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) =>
                registration.active?.scriptURL.endsWith('/mockServiceWorker.js'),
              )
              .map((registration) => registration.unregister()),
          ),
        )
        .catch(() => undefined);
      return;
    }
    startMswBrowser(mocked, () => import('msw/browser')).catch(() => {
      // Worker failed to start — dev requests fall through to the network.
    });
  }, []);

  return null;
}
