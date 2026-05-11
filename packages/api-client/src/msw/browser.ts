import { setupWorker } from 'msw/browser';
import { type ApiModule, buildHandlers } from './index';

export function startMockWorker(mocked: ApiModule[]) {
  if (mocked.length === 0) return Promise.resolve();
  const worker = setupWorker(...buildHandlers(mocked));
  return worker.start({ onUnhandledRequest: 'bypass' });
}
