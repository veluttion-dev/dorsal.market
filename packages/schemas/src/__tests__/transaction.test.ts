import { describe, expect, it } from 'vitest';
import {
  BuyerTransactionDetail,
  ReserveListingResponse,
  SellerProblemReport,
  TransactionStatus,
} from '../transaction';

describe('TransactionStatus', () => {
  it('accepts released_to_seller and refunded_to_buyer from the backend contract', () => {
    expect(TransactionStatus.parse('released_to_seller')).toBe('released_to_seller');
    expect(TransactionStatus.parse('refunded_to_buyer')).toBe('refunded_to_buyer');
  });
});

describe('ReserveListingResponse', () => {
  it('parses a typical backend reservation response', () => {
    const out = ReserveListingResponse.parse({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      stripe_payment_intent_client_secret: 'pi_secret_x',
      amount: '45.00',
      expires_at: '2026-05-14T12:00:00Z',
    });

    expect(out.amount).toBe(45);
  });
});

describe('BuyerTransactionDetail', () => {
  it('includes the embedded dorsal snapshot needed by the buyer view', () => {
    const sample = {
      id: '11111111-1111-4111-8111-111111111111',
      dorsal_id: '55555555-5555-4555-8555-555555555555',
      buyer_id: '22222222-2222-4222-8222-222222222222',
      seller_id: '33333333-3333-4333-8333-333333333333',
      status: 'paid' as const,
      amount: 45,
      currency: 'EUR' as const,
      stripe_payment_intent_client_secret: null,
      proof_file_url: null,
      timeline: [],
      dorsal_snapshot: {
        race_name: 'Madrid',
        race_date: '2026-12-31',
        location: 'Madrid',
        distance: '10k',
        photo_url: 'https://x/y.jpg',
      },
      created_at: '2026-05-14T10:00:00Z',
      updated_at: '2026-05-14T10:00:00Z',
    };

    expect(BuyerTransactionDetail.parse(sample).dorsal_snapshot.race_name).toBe('Madrid');
  });
});

describe('SellerProblemReport', () => {
  it('accepts the race_rejected_transfer category', () => {
    const parsed = SellerProblemReport.parse({
      id: '88888888-8888-4888-8888-888888888888',
      transaction_id: '11111111-1111-4111-8111-111111111111',
      seller_id: '33333333-3333-4333-8333-333333333333',
      category: 'race_rejected_transfer',
      message: 'organizer rejected',
      attachments: [],
      status: 'open',
      resolution_notes: null,
      created_at: '2026-05-14T10:00:00Z',
    });

    expect(parsed.category).toBe('race_rejected_transfer');
  });
});
