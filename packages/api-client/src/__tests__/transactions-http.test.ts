import { describe, expect, it, vi } from 'vitest';
import { TransactionsHttpAdapter } from '../adapters';
import type { HttpClient, HttpRequest } from '../http';

function createHttpStub(overrides: Partial<Record<keyof HttpClient, unknown>> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as HttpClient;
}

describe('TransactionsHttpAdapter', () => {
  it('reserves a listing through the real backend endpoint shape', async () => {
    const post = vi.fn(async () => ({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'pi_secret_x',
      reservation_expires_at: '2026-05-14T12:00:00Z',
    }));
    const http = createHttpStub({ post });
    const adapter = new TransactionsHttpAdapter(http);

    const result = await adapter.reserveListing({
      dorsalId: '55555555-5555-4555-8555-555555555555',
      buyerId: '22222222-2222-4222-8222-222222222222',
    });

    expect(post).toHaveBeenCalledWith('api/v1/transactions', {
      body: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        buyer_id: '22222222-2222-4222-8222-222222222222',
      },
    });
    expect(result.payment_client_secret).toBe('pi_secret_x');
  });

  it('gets buyer transaction detail from the buyer-specific route', async () => {
    const get = vi.fn(async () => ({
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
      timeline: [{ key: 'payment_held', label: 'Payment held', completed_at: null }],
      seller_deadline_at: null,
      buyer_deadline_at: null,
    }));
    const http = createHttpStub({ get });
    const adapter = new TransactionsHttpAdapter(http);

    const result = await adapter.getBuyerTransaction('11111111-1111-4111-8111-111111111111');

    expect(get).toHaveBeenCalledWith(
      'api/v1/transactions/buyer/11111111-1111-4111-8111-111111111111',
    );
    expect(result.order_summary.race_name).toBe('Madrid');
  });

  it('passes query params through history endpoints', async () => {
    const get = vi.fn(async (_path: string, _opts?: HttpRequest) => ({
      items: [],
      limit: 20,
      offset: 0,
    }));
    const http = createHttpStub({ get });
    const adapter = new TransactionsHttpAdapter(http);

    await adapter.listMyPurchases({ status: 'PAYMENT_RECEIVED', limit: 20, offset: 0 });

    expect(get).toHaveBeenCalledWith('api/v1/me/purchases', {
      query: { status: 'PAYMENT_RECEIVED', limit: 20, offset: 0 },
    });
  });

  it('does not invent availability state when reserving a listing', async () => {
    const post = vi.fn(async () => ({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'pi_secret_x',
      reservation_expires_at: '2026-05-24T18:33:20Z',
    }));
    const http = createHttpStub({ post });
    const adapter = new TransactionsHttpAdapter(http);

    await adapter.reserveListing({
      dorsalId: '55555555-5555-4555-8555-555555555555',
      buyerId: '22222222-2222-4222-8222-222222222222',
    });

    expect(post).toHaveBeenCalledWith('api/v1/transactions', {
      body: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        buyer_id: '22222222-2222-4222-8222-222222222222',
      },
    });
  });
});
