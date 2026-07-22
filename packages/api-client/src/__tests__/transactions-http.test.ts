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
  it('starts seller onboarding using the authenticated backend principal', async () => {
    const post = vi.fn(async () => ({
      account_id: 'acct_ready',
      onboarding_url: null,
      charges_enabled: true,
    }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    const result = await adapter.onboardSeller();

    expect(post).toHaveBeenCalledWith('api/v1/sellers/onboard');
    expect(result.charges_enabled).toBe(true);
  });

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
    });

    expect(post).toHaveBeenCalledWith('api/v1/transactions', {
      body: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
      },
    });
    expect(result.payment_client_secret).toBe('pi_secret_x');
  });

  it('normalizes timezone-less backend reservation expiry as UTC', async () => {
    const post = vi.fn(async () => ({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'pi_secret_x',
      reservation_expires_at: '2026-07-05T18:46:20.256562',
    }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    const result = await adapter.reserveListing({
      dorsalId: '55555555-5555-4555-8555-555555555555',
    });

    expect(result.reservation_expires_at).toBe('2026-07-05T18:46:20.256562Z');
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

  it('parses seller transaction detail when backend omits buyer profile whatsapp number', async () => {
    const get = vi.fn(async () => ({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      status: 'PAYMENT_RECEIVED',
      lifecycle_state: 'PAYMENT_RECEIVED',
      buyer_contact: {
        buyer_id: '22222222-2222-4222-8222-222222222222',
        full_name: 'Buyer Demo',
        phone_number: '600000000',
        whatsapp_number: null,
        email: 'buyer@example.com',
      },
      buyer_profile: {
        buyer_id: '22222222-2222-4222-8222-222222222222',
        full_name: 'Buyer Demo',
        dni: '88888888L',
        phone_number: '600000000',
        t_shirt_size: 'S',
        estimated_time: null,
        medical_info: null,
        emergency_contact: null,
      },
      order_summary: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        race_name: 'Madrid',
        bib_number: '11',
        amount_eur: '54.00',
      },
      timeline: [{ key: 'payment_held', label: 'Payment held', completed_at: null }],
      seller_deadline_at: '2026-07-26T19:33:32.689335',
      buyer_deadline_at: null,
    }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ get }));

    const result = await adapter.getSellerTransaction('11111111-1111-4111-8111-111111111111');

    expect(get).toHaveBeenCalledWith(
      'api/v1/transactions/seller/11111111-1111-4111-8111-111111111111',
    );
    expect(result.buyer_profile?.whatsapp_number).toBeNull();
  });

  it('confirms transfer and parses the backend action response', async () => {
    const post = vi.fn(async () => ({ processed: true }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    const result = await adapter.confirmTransfer('11111111-1111-4111-8111-111111111111');

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/confirm',
      { headers: { 'Idempotency-Key': 'confirm-transfer-11111111-1111-4111-8111-111111111111' } },
    );
    expect(result.processed).toBe(true);
  });

  it('starts seller transfer using the authenticated backend principal', async () => {
    const post = vi.fn(async () => ({ processed: true }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    await adapter.markTransferInProgress('11111111-1111-4111-8111-111111111111');

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/transfer-in-progress',
    );
  });

  it('requests proof upload URLs without sending a seller id', async () => {
    const post = vi.fn(async () => ({
      upload_url: 'https://storage.example/upload',
      file_url: 'https://storage.example/proof.png',
    }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    await adapter.getProofUploadUrl('11111111-1111-4111-8111-111111111111', {
      contentType: 'image/png',
    });

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/proof-upload-url',
      { body: { content_type: 'image/png' } },
    );
  });

  it('uploads proof multipart with an idempotency key', async () => {
    const post = vi.fn(async () => ({ processed: true }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));
    const file = new File(['proof-bytes'], 'proof.png', { type: 'image/png' });

    await adapter.uploadProofMultipart('11111111-1111-4111-8111-111111111111', file);

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/upload-proof',
      {
        body: expect.any(FormData),
        headers: {
          'Idempotency-Key': 'upload-proof-11111111-1111-4111-8111-111111111111-proof.png-11',
        },
      },
    );
  });

  it('submits proof URLs without sending a seller id', async () => {
    const post = vi.fn(async () => ({ processed: true }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    await adapter.submitProofUrl('11111111-1111-4111-8111-111111111111', {
      proofFileUrl: 'https://storage.example/proof.png',
    });

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/proof',
      { body: { proof_file_url: 'https://storage.example/proof.png' } },
    );
  });

  it('opens disputes without sending a buyer id', async () => {
    const post = vi.fn(async () => ({
      id: '99999999-9999-4999-8999-999999999999',
      transaction_id: '11111111-1111-4111-8111-111111111111',
      opened_by: '22222222-2222-4222-8222-222222222222',
      reason: 'The transfer has not arrived yet',
      status: 'open',
      resolution_notes: null,
      created_at: '2026-07-13T10:00:00Z',
    }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    await adapter.openDispute('11111111-1111-4111-8111-111111111111', {
      reason: 'The transfer has not arrived yet',
    });

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/dispute',
      { body: { reason: 'The transfer has not arrived yet' } },
    );
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
    });

    expect(post).toHaveBeenCalledWith('api/v1/transactions', {
      body: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
      },
    });
  });

  it('sends runner data as part of the reservation', async () => {
    const post = vi.fn(async () => ({
      transaction_id: '11111111-1111-4111-8111-111111111111',
      payment_client_secret: 'pi_secret_x',
      reservation_expires_at: '2026-05-24T18:33:20Z',
    }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ post }));

    await adapter.reserveListing({
      dorsalId: '55555555-5555-4555-8555-555555555555',
      runnerData: {
        estimated_time: '01:45:00',
        emergency_contact: 'Ana +34600000000',
      },
    });

    expect(post).toHaveBeenCalledWith('api/v1/transactions', {
      body: {
        dorsal_id: '55555555-5555-4555-8555-555555555555',
        runner_data: {
          estimated_time: '01:45:00',
          emergency_contact: 'Ana +34600000000',
        },
      },
    });
  });

  it('expires a checkout reservation through the buyer endpoint', async () => {
    const post = vi.fn(async () => ({ processed: true }));
    const http = createHttpStub({ post });
    const adapter = new TransactionsHttpAdapter(http);

    await adapter.expireReservation('11111111-1111-4111-8111-111111111111');

    expect(post).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/expire-reservation',
    );
  });

  it('updates checkout runner data through the buyer endpoint', async () => {
    const patch = vi.fn(async () => ({ processed: true }));
    const adapter = new TransactionsHttpAdapter(createHttpStub({ patch }));

    await adapter.updateCheckoutRunnerData('11111111-1111-4111-8111-111111111111', {
      estimated_time: '01:45:00',
      t_shirt_size: 'M',
      emergency_contact: 'Ana +34600000000',
    });

    expect(patch).toHaveBeenCalledWith(
      'api/v1/transactions/11111111-1111-4111-8111-111111111111/runner-data',
      {
        body: {
          estimated_time: '01:45:00',
          t_shirt_size: 'M',
          emergency_contact: 'Ana +34600000000',
        },
      },
    );
  });
});
