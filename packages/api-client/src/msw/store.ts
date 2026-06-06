import type {
  BuyerTransactionDetail,
  Review,
  SellerTransactionDetail,
  User,
} from '@dorsal/schemas';

const SEED_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const E2E_BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';

const seedUser: UserProfile = {
  id: SEED_USER_ID,
  email: 'demo@dorsal.market',
  first_name: 'Carlos',
  last_name: 'Martinez',
  dni: '12345678X',
  gender: 'male',
  age: 35,
  phone_number: '612345678',
  whatsapp_number: '612345678',
  postal_code: '28001',
  address: 'Calle Mayor 1',
  estimated_time: '01:35:00',
  t_shirt_size: 'L',
  club: 'Runners Madrid',
  federation_license: null,
  medical_info: null,
  emergency_contact: 'Contacto emergencia +34600999888',
  additional_info: null,
  profile_complete: true,
  runner_data_complete: true,
};

const e2eBuyerUser: UserProfile = {
  ...seedUser,
  id: E2E_BUYER_USER_ID,
  email: 'ana.buyer@dorsal.market',
  first_name: 'Ana',
  last_name: 'Buyer',
  gender: 'female',
  dni: '87654321Z',
};

export type MockTransaction = {
  transaction_id: string;
  dorsal_id: string;
  buyer_id: string;
  seller_id: string;
  status: TransactionStatus;
  lifecycle_state: string;
  amount_eur: number;
  race_name: string;
  race_date: string | null;
  distance: string | null;
  location: string | null;
  bib_number: string | null;
  payment_method: string;
  proof_file_url: string | null;
  timeline: TimelineEvent[];
  seller_deadline_at: string | null;
  buyer_deadline_at: string | null;
  created_at: string;
};

export type MockTransaction = BuyerTransactionDetail & {
  buyer_snapshot: SellerTransactionDetail['buyer_snapshot'];
};

export const mockStore = {
  users: new Map<string, UserProfile>([
    [SEED_USER_ID, seedUser],
    [E2E_BUYER_USER_ID, e2eBuyerUser],
  ]),
  passwords: new Map<string, string>([['demo@dorsal.market', 'demo1234']]),
  transactions: new Map<string, MockTransaction>(),
  reviews: new Map<string, Review>(),
  SEED_USER_ID,
};

export function resetStore() {
  mockStore.transactions.clear();
  mockStore.reviews.clear();
}
