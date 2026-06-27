import { buildHandlers } from '@dorsal/api-client';

type MockedApiModule = Parameters<typeof buildHandlers>[0][number];
type SetupWorker = (...handlers: ReturnType<typeof buildHandlers>) => {
  start(options: { onUnhandledRequest: 'bypass' }): Promise<unknown>;
};
type LoadSetupWorker = () => Promise<{ setupWorker: SetupWorker }>;
type MswGlobal = typeof globalThis & {
  __dorsalMswStartPromise: Promise<void> | undefined;
};

export function startMswBrowser(
  mocked: MockedApiModule[],
  loadSetupWorker: LoadSetupWorker,
): Promise<void> {
  const scope = globalThis as MswGlobal;

  if (!scope.__dorsalMswStartPromise) {
    const startPromise = (async () => {
      const { setupWorker } = await loadSetupWorker();
      const worker = setupWorker(...buildHandlers(mocked));
      await worker.start({ onUnhandledRequest: 'bypass' });
    })();

    scope.__dorsalMswStartPromise = startPromise;
    startPromise.catch(() => {
      if (scope.__dorsalMswStartPromise === startPromise) {
        scope.__dorsalMswStartPromise = undefined;
      }
    });
  }

  return scope.__dorsalMswStartPromise;
}
