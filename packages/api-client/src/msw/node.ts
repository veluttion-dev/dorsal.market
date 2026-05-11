import { setupServer } from 'msw/node';
import { type ApiModule, buildHandlers } from './index';

export function startMockServer(mocked: ApiModule[]) {
  return setupServer(...buildHandlers(mocked));
}
