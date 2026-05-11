import { reviewsHandlers } from './reviews';
import { transactionsHandlers } from './transactions';
import { usersHandlers } from './users';

export const handlersByModule = {
  users: usersHandlers,
  transactions: transactionsHandlers,
  reviews: reviewsHandlers,
} as const;

export type ApiModule = keyof typeof handlersByModule;

export function buildHandlers(mocked: ApiModule[]) {
  return mocked.flatMap((m) => handlersByModule[m]);
}

export { mockStore, resetStore } from './store';
