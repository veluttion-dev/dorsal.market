import type { Review, Transaction, User } from '@dorsal/schemas';

const SEED_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

const seedUser: User = {
  id: SEED_USER_ID,
  email: 'demo@dorsal.market',
  full_name: 'Carlos Martínez',
  dni: '12345678X',
  gender: 'male',
  birth_date: '1990-06-15',
  avatar_url: null,
  rating_average: 4.7,
  total_sales: 12,
  total_purchases: 5,
  contact: {
    phone: '612345678',
    address_line: 'Calle Mayor 1',
    city: 'Madrid',
    postal_code: '28001',
    country: 'ES',
  },
  runner: {
    estimated_time_min: 95,
    shirt_size: 'L',
    club: 'Runners Madrid',
    allergies: null,
  },
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2026-04-19T20:00:00Z',
};

export const mockStore = {
  users: new Map<string, User>([[SEED_USER_ID, seedUser]]),
  passwords: new Map<string, string>([['demo@dorsal.market', 'demo1234']]),
  transactions: new Map<string, Transaction>(),
  reviews: new Map<string, Review>(),
  SEED_USER_ID,
};

export function resetStore() {
  mockStore.transactions.clear();
  mockStore.reviews.clear();
}
