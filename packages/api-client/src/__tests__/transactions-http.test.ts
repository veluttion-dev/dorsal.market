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
      stripe_payment_intent_client_secret: 'pi_secret_x',
      amount: '45.00',
      expires_at: '2026-05-14T12:00:00Z',
    }));
    const http = createHttpStub({ post });
    const adapter = new TransactionsHttpAdapter(http, 'http://api.test');

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
    expect(result.amount).toBe(45);
  });

  it('gets buyer transaction detail from the buyer-specific route', async () => {
    const get = vi.fn(async () => ({
      id: '11111111-1111-4111-8111-111111111111',
      dorsal_id: '55555555-5555-4555-8555-555555555555',
      buyer_id: '22222222-2222-4222-8222-222222222222',
      seller_id: '33333333-3333-4333-8333-333333333333',
      status: 'paid',
      amount: 45,
      currency: 'EUR',
      stripe_payment_intent_client_secret: null,
      proof_file_url: null,
      timeline: [{ type: 'payment_succeeded', at: '2026-05-14T12:00:00Z', actor: 'system' }],
      dorsal_snapshot: {
        race_name: 'Madrid',
        race_date: '2026-12-31',
        location: 'Madrid',
        distance: '10k',
        photo_url: 'https://x/y.jpg',
      },
      created_at: '2026-05-14T10:00:00Z',
      updated_at: '2026-05-14T10:00:00Z',
    }));
    const http = createHttpStub({ get });
    const adapter = new TransactionsHttpAdapter(http, 'http://api.test');

    const result = await adapter.getBuyerTransaction('11111111-1111-4111-8111-111111111111');

    expect(get).toHaveBeenCalledWith(
      'api/v1/transactions/buyer/11111111-1111-4111-8111-111111111111',
    );
    expect(result.dorsal_snapshot.race_name).toBe('Madrid');
  });

  it('passes query params through history endpoints', async () => {
    const get = vi.fn(async (_path: string, _opts?: HttpRequest) => ({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    }));
    const http = createHttpStub({ get });
    const adapter = new TransactionsHttpAdapter(http, 'http://api.test');

    await adapter.listMyPurchases({ status: 'paid', limit: 20, offset: 0 });

    expect(get).toHaveBeenCalledWith('api/v1/me/purchases', {
      query: { status: 'paid', limit: 20, offset: 0 },
    });
  });
});
