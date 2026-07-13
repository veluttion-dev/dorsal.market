import { describe, expect, it } from 'vitest';
import {
  BuyerTransactionDetail,
  ProofUploadUrlResponse,
  ReserveListingResponse,
  SellerProblemReport,
  SellerTransactionDetail,
  TransactionListResponse,
  TransactionStatus,
} from '../transaction';

describe('TransactionStatus', () => {
  it('accepts the canonical backend uppercase statuses', () => {
    expect(TransactionStatus.parse('RELEASED_TO_SELLER')).toBe('RELEASED_TO_SELLER');
    expect(TransactionStatus.parse('REFUNDED_TO_BUYER')).toBe('REFUNDED_TO_BUYER');
  });

  it('rejects the removed legacy lowercase statuses', () => {
    expect(TransactionStatus.safeParse('released_to_seller').success).toBe(false);
    expect(TransactionStatus.safeParse('paid').success).toBe(false);
  });
});

describe('ReserveListingResponse', () => {
  it('parses a typical backend reservation response', () => {
    const out = ReserveListingResponse.parse({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'pi_secret_x',
      reservation_expires_at: '2026-05-14T12:00:00Z',
    });

    expect(out.payment_client_secret).toBe('pi_secret_x');
  });
});

describe('BuyerTransactionDetail', () => {
  it('derives optional lifecycle and whatsapp fields from the real backend detail', () => {
    const parsed = BuyerTransactionDetail.parse({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      status: 'PAYMENT_RECEIVED',
      seller_contact: {
        seller_id: '33333333-3333-4333-8333-333333333333',
        full_name: 'Seller Demo',
        phone_number: null,
        email: null,
      },
      order_summary: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        race_name: 'Madrid',
        bib_number: null,
        amount_eur: '45.00',
      },
      buyer_data_checklist: [],
      timeline: [{ key: 'payment_held', label: 'Payment held', completed_at: null }],
      seller_deadline_at: null,
      buyer_deadline_at: null,
    });

    expect(parsed.lifecycle_state).toBe('PAYMENT_RECEIVED');
    expect(parsed.seller_contact.whatsapp_number).toBeNull();
  });

  it('parses the current backend detail shape', () => {
    const sample = {
      transaction_id: '11111111-1111-4111-8111-111111111111',
      status: 'PAYMENT_RECEIVED',
      lifecycle_state: 'DATA_RELEASED',
      seller_contact: {
        seller_id: '33333333-3333-4333-8333-333333333333',
        full_name: 'Seller Demo',
        phone_number: null,
        whatsapp_number: null,
        email: null,
      },
      order_summary: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        race_name: 'Madrid',
        bib_number: null,
        amount_eur: '45.00',
      },
      buyer_data_checklist: [],
      timeline: [],
      seller_deadline_at: null,
      buyer_deadline_at: null,
    };

    expect(BuyerTransactionDetail.parse(sample).order_summary.race_name).toBe('Madrid');
  });
});

describe('SellerTransactionDetail', () => {
  it('parses buyer contact and transfer profile from the backend', () => {
    const sample = {
      transaction_id: '11111111-1111-4111-8111-111111111111',
      status: 'TRANSFER_IN_PROGRESS',
      lifecycle_state: 'TRANSFER_IN_PROGRESS',
      buyer_contact: {
        buyer_id: '22222222-2222-4222-8222-222222222222',
        full_name: 'Buyer Demo',
        phone_number: '600000000',
        whatsapp_number: null,
        email: 'buyer@example.com',
      },
      buyer_profile: null,
      order_summary: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        race_name: 'Madrid',
        bib_number: 'A-10',
        amount_eur: '45.00',
      },
      timeline: [{ key: 'payment_held', label: 'Payment held', completed_at: null }],
      seller_deadline_at: null,
      buyer_deadline_at: null,
    };

    expect(SellerTransactionDetail.parse(sample).buyer_contact.full_name).toBe('Buyer Demo');
  });
});

describe('TransactionListResponse', () => {
  it('parses backend history without requiring a total field', () => {
    const parsed = TransactionListResponse.parse({
      items: [
        {
          transaction_id: '11111111-1111-4111-8111-111111111111',
          race_name: 'Madrid',
          race_date: '2026-12-31',
          distance: '10k',
          location: 'Madrid',
          payment_method: 'stripe',
          price: '45.00',
          technical_status: 'PAYMENT_RECEIVED',
          ui_status: 'DATA_RELEASED',
          ui_status_label: 'Datos liberados',
        },
      ],
      limit: 20,
      offset: 0,
    });

    expect(parsed.items[0]?.price).toBe(45);
  });
});

describe('ProofUploadUrlResponse', () => {
  it('parses the backend file_url field', () => {
    const parsed = ProofUploadUrlResponse.parse({
      upload_url: 'https://example.com/upload',
      file_url: 'https://example.com/file.pdf',
    });

    expect(parsed.file_url).toContain('file.pdf');
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
