export const transactionKeys = {
  buyer: (userId: string, id: string) => ['transactions', 'buyer', userId, id] as const,
  seller: (userId: string, id: string) => ['transactions', 'seller', userId, id] as const,
  purchases: (userId: string, query?: { status?: string; limit?: number; offset?: number }) =>
    ['transactions', 'purchases', userId, query ?? {}] as const,
  sales: (userId: string, query?: { status?: string; limit?: number; offset?: number }) =>
    ['transactions', 'sales', userId, query ?? {}] as const,
};
