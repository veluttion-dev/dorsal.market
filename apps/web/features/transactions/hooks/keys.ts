export const transactionKeys = {
  buyer: (id: string) => ['transactions', 'buyer', id] as const,
  seller: (id: string) => ['transactions', 'seller', id] as const,
  purchases: (query?: { status?: string; limit?: number; offset?: number }) =>
    ['transactions', 'purchases', query ?? {}] as const,
  sales: (query?: { status?: string; limit?: number; offset?: number }) =>
    ['transactions', 'sales', query ?? {}] as const,
};
