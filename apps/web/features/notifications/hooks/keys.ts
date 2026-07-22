export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
  list: (userId: string, query?: { limit?: number; offset?: number }) =>
    ['notifications', userId, query ?? {}] as const,
};
